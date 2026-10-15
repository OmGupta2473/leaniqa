import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const RAZORPAY_API = "https://api.razorpay.com/v1";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
      return json({ error: "Guest accounts cannot manage subscriptions." }, 403);
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) return json({ error: "server_misconfiguration" }, 500);
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: sub, error: subError } = await admin
      .from("subscriptions")
      .select("plan, status, razorpay_subscription_id, current_period_end")
      .eq("user_id", user.id)
      .maybeSingle();

    if (subError) {
      console.error("Failed to read subscription", { error: subError.message });
      return json({ error: "db_error" }, 500);
    }
    if (!sub) return json({ error: "No subscription found" }, 404);

    if (!sub.razorpay_subscription_id) {
      return json(
        { error: "This plan is not managed through Razorpay." },
        400,
      );
    }

    if (sub.status === "cancelled") {
      return json({
        ok: true,
        already_cancelled: true,
        current_period_end: sub.current_period_end,
      });
    }
    if (sub.status === "expired") {
      return json({ error: "Subscription already ended." }, 400);
    }

    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keyId || !keySecret) {
      return json({ error: "server_misconfiguration" }, 500);
    }

    const basicAuth = btoa(`${keyId}:${keySecret}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6_000);

    let rzpRes: Response;
    try {
      rzpRes = await fetch(
        `${RAZORPAY_API}/subscriptions/${sub.razorpay_subscription_id}/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${basicAuth}`,
          },
          body: JSON.stringify({ cancel_at_cycle_end: 1 }),
          signal: controller.signal,
        },
      );
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      const aborted =
        fetchErr instanceof DOMException && fetchErr.name === "AbortError";
      console.error("Razorpay cancel fetch failed", {
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
      console.error("Razorpay cancel failed", {
        userId: user.id,
        status: rzpRes.status,
        body: errBody.slice(0, 500),
      });
      // Razorpay returns a specific error if the sub is already cancelled.
      // Treat that as success so we can still sync local state.
      const lower = errBody.toLowerCase();
      if (lower.includes("already") || lower.includes("cancelled")) {
        await admin
          .from("subscriptions")
          .update({ status: "cancelled" })
          .eq("user_id", user.id);
        return json({
          ok: true,
          already_cancelled: true,
          current_period_end: sub.current_period_end,
        });
      }
      return json({ error: "Could not cancel subscription. Please try again." }, 502);
    }

    const { error: updateError } = await admin
      .from("subscriptions")
      .update({ status: "cancelled" })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Failed to update subscription status", {
        userId: user.id,
        error: updateError.message,
      });
      // Not fatal — the webhook will reconcile.
    }

    return json({
      ok: true,
      current_period_end: sub.current_period_end,
    });
  } catch (err) {
    console.error("Unhandled error in cancel-razorpay-subscription", {
      message: err instanceof Error ? err.message : String(err),
    });
    return json({ error: "Server error. Please try again." }, 500);
  }
});