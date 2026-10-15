import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const RAZORPAY_API = "https://api.razorpay.com/v1";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PLAN_PRICES_PAISE: Record<"discipline" | "premium", number> = {
  discipline: 14900,
  premium: 29900,
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "missing_auth" }, 401);
    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return json({ error: "invalid_token" }, 401);

    if ((user as { is_anonymous?: boolean }).is_anonymous === true) {
      return json({ error: "Guest accounts cannot purchase." }, 403);
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json({ error: "invalid_body" }, 400);
    }

    const plan = (body as { plan?: string }).plan;
    if (plan !== "discipline" && plan !== "premium") {
      return json({ error: "plan must be 'discipline' or 'premium'" }, 400);
    }

    const amountPaise = PLAN_PRICES_PAISE[plan];

    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select(
        "plan, status, current_period_end, access_type, razorpay_subscription_id",
      )
      .eq("user_id", user.id)
      .maybeSingle();

    // Block only when a Razorpay subscription is actively managing this user.
    // One-time access (access_type = 'one_time') is extended, not blocked.
    // A cancelled-but-unexpired subscription still has paid access, so block.
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
            "You already have an active subscription. It renews automatically or is set to end at your billing period.",
        },
        409,
      );
    }

    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keyId || !keySecret) {
      return json({ error: "server_misconfiguration" }, 500);
    }

    const basicAuth = btoa(`${keyId}:${keySecret}`);
    const receipt = `one_${user.id.slice(0, 8)}_${Date.now()}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6_000);

    let rzpRes: Response;
    try {
      rzpRes = await fetch(`${RAZORPAY_API}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${basicAuth}`,
        },
        body: JSON.stringify({
          amount: amountPaise,
          currency: "INR",
          receipt,
          notes: {
            lean_iqa_user_id: user.id,
            lean_iqa_plan: plan,
            lean_iqa_access_type: "one_time",
          },
        }),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      const aborted =
        fetchErr instanceof DOMException && fetchErr.name === "AbortError";
      console.error("Razorpay order fetch failed", {
        userId: user.id,
        aborted,
        message: fetchErr instanceof Error ? fetchErr.message : String(fetchErr),
      });
      return json(
        {
          error: aborted
            ? "Razorpay did not respond in time. Please try again."
            : "Could not reach Razorpay. Please try again.",
        },
        504,
      );
    }
    clearTimeout(timeoutId);

    if (!rzpRes.ok) {
      const errBody = await rzpRes.text().catch(() => "");
      console.error("Razorpay order creation failed", {
        userId: user.id,
        status: rzpRes.status,
        body: errBody.slice(0, 500),
      });
      return json({ error: "Could not start checkout. Please try again." }, 502);
    }

    const rzpData = (await rzpRes.json()) as { id: string; amount: number };
    return json({
      order_id: rzpData.id,
      amount: rzpData.amount,
      razorpay_key_id: keyId,
      plan,
    });
  } catch (err) {
    console.error("Unhandled error in create-razorpay-order", {
      message: err instanceof Error ? err.message : String(err),
    });
    return json({ error: "Server error. Please try again." }, 500);
  }
});