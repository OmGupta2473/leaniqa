import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RAZORPAY_API = "https://api.razorpay.com/v1";

// TODO(security): tighten to your real origins before production launch.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function planIdFor(plan: string, cycle: string): string | null {
  if (plan === "discipline" && cycle === "monthly") {
    return Deno.env.get("RAZORPAY_PLAN_DISCIPLINE_MONTHLY") ?? null;
  }
  if (plan === "discipline" && cycle === "annual") {
    return Deno.env.get("RAZORPAY_PLAN_DISCIPLINE_ANNUAL") ?? null;
  }
  if (plan === "premium" && cycle === "monthly") {
    return Deno.env.get("RAZORPAY_PLAN_PREMIUM_MONTHLY") ?? null;
  }
  if (plan === "premium" && cycle === "annual") {
    return Deno.env.get("RAZORPAY_PLAN_PREMIUM_ANNUAL") ?? null;
  }
  return null;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Unauthorized: missing Authorization header" }, 401);
    }
    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return json({ error: "Unauthorized: invalid token" }, 401);
    }

    // Guests cannot subscribe.
    if ((user as { is_anonymous?: boolean }).is_anonymous === true) {
      return json(
        { error: "Guest accounts cannot subscribe. Link Google or email first." },
        403,
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json({ error: "Invalid request body" }, 400);
    }

    const plan = (body as { plan?: string }).plan;
    const billingCycle = (body as { billingCycle?: string }).billingCycle;

    if (plan !== "discipline" && plan !== "premium") {
      return json({ error: "plan must be 'discipline' or 'premium'" }, 400);
    }
    if (billingCycle !== "monthly" && billingCycle !== "annual") {
      return json({ error: "billingCycle must be 'monthly' or 'annual'" }, 400);
    }

    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("plan, status, current_period_end, access_type, razorpay_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const isBlockingSubscription =
      existingSub?.razorpay_subscription_id != null &&
      existingSub.access_type !== "one_time" &&
      existingSub.plan !== "free" &&
      (existingSub.status === "active" ||
        (existingSub.status === "cancelled" &&
          existingSub.current_period_end != null &&
          new Date(existingSub.current_period_end as string) > new Date()));

    if (isBlockingSubscription) {
      return json(
        {
          error:
            "You already have an active subscription. Cancel it from Profile → Manage subscription, or wait until your current period ends before subscribing again.",
          error_code: "duplicate_subscription",
        },
        409,
      );
    }

    const razorpayPlanId = planIdFor(plan, billingCycle);
    if (!razorpayPlanId) {
      return json(
        { error: `Missing Razorpay plan ID for ${plan}/${billingCycle}` },
        500,
      );
    }

    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keyId || !keySecret) {
      return json({ error: "Razorpay credentials not configured" }, 500);
    }

    // total_count = max billing cycles before forced re-subscribe.
    // 120 monthly = 10 years. 10 annual = 10 years.
    const totalCount = billingCycle === "monthly" ? 120 : 10;

    const basicAuth = btoa(`${keyId}:${keySecret}`);

    // The Subscriptions API does not accept callback_url — that parameter
    // is only for Payment Links. The client opens Razorpay Checkout.js with
    // the subscription_id and controls the post-payment redirect itself.
    const rzpController = new AbortController();
    const rzpTimeoutId = setTimeout(() => rzpController.abort(), 6_000);

    let rzpRes: Response;
    try {
      rzpRes = await fetch(`${RAZORPAY_API}/subscriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${basicAuth}`,
        },
        body: JSON.stringify({
          plan_id: razorpayPlanId,
          total_count: totalCount,
          quantity: 1,
          customer_notify: 1,
          notes: {
            lean_iqa_user_id: user.id,
            lean_iqa_plan: plan,
            lean_iqa_billing_cycle: billingCycle,
          },
        }),
        signal: rzpController.signal,
      });
    } catch (fetchErr) {
      clearTimeout(rzpTimeoutId);
      const isAbort = fetchErr instanceof DOMException && fetchErr.name === "AbortError";
      console.error("Razorpay fetch failed", {
        userId: user.id,
        plan,
        billingCycle,
        aborted: isAbort,
        message: fetchErr instanceof Error ? fetchErr.message : String(fetchErr),
      });
      return json(
        {
          error: isAbort
            ? "Razorpay did not respond in time. Please try again."
            : "Could not reach Razorpay. Check your connection and try again.",
        },
        504,
      );
    }
    clearTimeout(rzpTimeoutId);

    if (!rzpRes.ok) {
      const errBody = await rzpRes.text().catch(() => "");
      console.error("Razorpay subscription creation failed", {
        status: rzpRes.status,
        body: errBody.slice(0, 500),
        userId: user.id,
      });
      return json({ error: "Could not create subscription. Please try again." }, 502);
    }

    const rzpData = await rzpRes.json() as { id: string; short_url: string };
    const subscriptionId = rzpData.id;
    const shortUrl = rzpData.short_url;

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) {
      return json({ error: "Server misconfiguration" }, 500);
    }
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Ensure the subscriptions row exists before updating it.
    await supabase.rpc("get_or_create_subscription", { p_user_id: user.id });

    // Store the Razorpay IDs. Plan stays 'free' until the webhook confirms
    // payment. The service role is required here because the user-facing
    // RLS policy on subscriptions is SELECT-only.
    const { error: updateError } = await admin
      .from("subscriptions")
      .update({
        razorpay_subscription_id: subscriptionId,
        razorpay_plan_id: razorpayPlanId,
        billing_cycle: billingCycle,
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Failed to store subscription ID", {
        userId: user.id,
        error: updateError.message,
      });
      // Not fatal — the webhook will find the user via notes.lean_iqa_user_id.
    }

    return json({
      subscription_id: subscriptionId,
      short_url: shortUrl,
      razorpay_key_id: keyId,
    });
  } catch (err) {
    console.error("Unhandled error in create-razorpay-subscription", {
      message: err instanceof Error ? err.message : String(err),
    });
    return json({ error: "Server error. Please try again." }, 500);
  }
});