import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Razorpay calls this endpoint from their servers, without a Supabase JWT.
// This function MUST be deployed with --no-verify-jwt.

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
async function verifyPaymentWithRazorpay(
  paymentId: string,
  expectedOrderId: string,
  expectedAmountPaise: number,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const keyId = Deno.env.get("RAZORPAY_KEY_ID");
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!keyId || !keySecret) return { ok: false, reason: "missing_credentials" };

  const basicAuth = btoa(`${keyId}:${keySecret}`);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5_000);

  try {
    const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Basic ${basicAuth}` },
      signal: controller.signal,
    });
    if (!res.ok) return { ok: false, reason: `http_${res.status}` };

    const p = await res.json() as {
      status: string;
      order_id: string;
      amount: number;
      captured: boolean;
    };
    if (p.status !== "captured" || !p.captured) {
      return { ok: false, reason: `status_${p.status}` };
    }
    if (p.order_id !== expectedOrderId) {
      return { ok: false, reason: "order_mismatch" };
    }
    if (p.amount !== expectedAmountPaise) {
      return { ok: false, reason: "amount_mismatch" };
    }
    return { ok: true };
  } catch (err) {
    const aborted = err instanceof DOMException && err.name === "AbortError";
    return { ok: false, reason: aborted ? "timeout" : "network" };
  } finally {
    clearTimeout(timeoutId);
  }
}
async function verifySignature(
  rawBody: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(rawBody),
  );
  const computed = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  // Constant-time comparison is overkill here since we're comparing hex of a
  // server-to-server signature, but we won't leak via early return on length.
  if (computed.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i += 1) {
    diff |= computed.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

interface RazorpaySubscriptionEntity {
  id: string;
  plan_id: string;
  status: string;
  current_start?: number | null;
  current_end?: number | null;
  charge_at?: number | null;
  notes?: Record<string, string> | null;
}

interface RazorpayPaymentEntity {
  id: string;
  order_id?: string | null;
  amount: number;
  currency: string;
  status: string;
  notes?: Record<string, string> | null;
}

interface RazorpayWebhookPayload {
  event?: string;
  payload?: {
    subscription?: {
      entity?: RazorpaySubscriptionEntity;
    };
    payment?: {
      entity?: RazorpayPaymentEntity;
    };
  };
}

/** Convert a Unix seconds timestamp to ISO, or null. */
function unixToIso(seconds: number | null | undefined): string | null {
  if (!seconds || !Number.isFinite(seconds)) return null;
  return new Date(seconds * 1000).toISOString();
}

/**
 * Determine whether a legacy beta_pro user should fall back to beta_pro or
 * free when their paid subscription ends. If their beta_expires_at is still
 * in the future, they keep beta access; otherwise free.
 */
function planForSubscriptionEnd(betaExpiresAt: string | null): string {
  if (betaExpiresAt && new Date(betaExpiresAt) > new Date()) {
    return "beta_pro";
  }
  return "free";
}

serve(async (req) => {
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  // Read raw body once. Signature verification needs the exact bytes.
  const rawBody = await req.text();

  const signature = req.headers.get("x-razorpay-signature") ?? "";
  const eventId = req.headers.get("x-razorpay-event-id") ?? "";

  if (!signature) {
    return json({ error: "missing_signature" }, 400);
  }
  if (!eventId) {
    return json({ error: "missing_event_id" }, 400);
  }

  const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.error("RAZORPAY_WEBHOOK_SECRET not configured");
    return json({ error: "server_misconfiguration" }, 500);
  }

  const valid = await verifySignature(rawBody, signature, webhookSecret);
  if (!valid) {
    console.error("Invalid Razorpay webhook signature", { eventId });
    return json({ error: "invalid_signature" }, 401);
  }

  let payload: RazorpayWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const eventType = payload.event ?? "unknown";

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Idempotency: insert first. If the row already exists, we've seen this
  // event before — return 200 without reprocessing.
  const { error: insertError } = await admin
    .from("razorpay_webhook_events")
    .insert({
      event_id: eventId,
      event_type: eventType,
      payload,
    });

  if (insertError) {
    if (insertError.code === "23505") {
      // Duplicate event — already processed.
      return json({ ok: true, duplicate: true });
    }
    console.error("Failed to record webhook event", {
      eventId,
      code: insertError.code,
      message: insertError.message,
    });
    return json({ error: "db_error" }, 500);
  }

  // payment.captured events have no subscription entity. Handle them here,
  // BEFORE the subscription-entity guard below.
  if (eventType === "payment.captured") {
    const payment = payload.payload?.payment?.entity;
    if (!payment) {
      console.log("payment.captured without payment entity", { eventId });
      return json({ ok: true, ignored: true });
    }

    const paymentNotes = payment.notes ?? {};
    const paymentUserId = paymentNotes.lean_iqa_user_id;
    const accessType = paymentNotes.lean_iqa_access_type;
    const paymentPlan = paymentNotes.lean_iqa_plan;

    // Only one-time purchases are handled here. Subscription charges
    // fire subscription.charged separately.
    if (accessType !== "one_time") {
      console.log("Ignoring non-one-time payment on payment.captured", {
        eventId,
        accessType,
      });
      return json({ ok: true, ignored: true });
    }

    if (!paymentUserId) {
      console.error("payment.captured missing lean_iqa_user_id", {
        eventId,
        paymentId: payment.id,
      });
      return json({ ok: true, ignored: true });
    }

    if (paymentPlan !== "discipline" && paymentPlan !== "premium") {
      console.error("payment.captured unknown plan", {
        eventId,
        plan: paymentPlan,
      });
      return json({ ok: true, ignored: true });
    }

    // Server-side verification: confirm with Razorpay that this payment was
    // actually captured and matches the expected order and amount. The
    // webhook signature proves authenticity; this proves integrity.
    const expectedAmount = paymentPlan === "premium" ? 29900 : 14900;
    const verification = await verifyPaymentWithRazorpay(
      payment.id,
      payment.order_id ?? "",
      expectedAmount,
    );

    if (!verification.ok) {
      console.error("payment_verification_failed", {
        eventId,
        paymentId: payment.id,
        orderId: payment.order_id,
        userId: paymentUserId,
        plan: paymentPlan,
        reason: verification.reason,
      });
      // Do NOT grant access. Return 200 so Razorpay stops retrying —
      // a verification failure will fail the same way on retry.
      return json({
        ok: true,
        verified: false,
        reason: verification.reason,
      });
    }

    // Extend from the later of now() and any existing one-time period_end.
    // The 1-day grace is baked into the stored value (UI shows 30 days).
    const { data: existingRow } = await admin
      .from("subscriptions")
      .select("current_period_end, access_type")
      .eq("user_id", paymentUserId)
      .maybeSingle();

    let baseMs = Date.now();
    if (
      existingRow?.access_type === "one_time" &&
      existingRow.current_period_end
    ) {
      const existingEndMs = new Date(existingRow.current_period_end).getTime();
      if (Number.isFinite(existingEndMs) && existingEndMs > baseMs) {
        baseMs = existingEndMs;
      }
    }

    const periodEndIso = new Date(baseMs + 31 * 24 * 60 * 60 * 1000).toISOString();

    const { error: updateErr } = await admin
      .from("subscriptions")
      .update({
        plan: paymentPlan,
        status: "active",
        access_type: "one_time",
        current_period_end: periodEndIso,
        billing_cycle: "monthly",
        razorpay_subscription_id: null,
        razorpay_plan_id: null,
        beta_expires_at: null,
      })
      .eq("user_id", paymentUserId);

    if (updateErr) {
      console.error("Failed to grant one-time access", {
        eventId,
        userId: paymentUserId,
        code: updateErr.code,
        message: updateErr.message,
      });
      return json({ error: "db_update_failed" }, 500);
    }

    console.log("One-time access granted", {
      eventId,
      userId: paymentUserId,
      plan: paymentPlan,
      paymentId: payment.id,
      periodEnd: periodEndIso,
    });
    return json({ ok: true });
  }

  const subscription = payload.payload?.subscription?.entity;

  // Nothing to reconcile — record and return.
  if (!subscription) {
    console.log("Webhook event with no subscription entity", {
      eventId,
      eventType,
    });
    return json({ ok: true, ignored: true });
  }

  const notes = subscription.notes ?? {};
  const userId = notes.lean_iqa_user_id;
  const requestedPlan = notes.lean_iqa_plan;
  const requestedCycle = notes.lean_iqa_billing_cycle;

  if (!userId) {
    console.error("Webhook missing lean_iqa_user_id in notes", {
      eventId,
      subscriptionId: subscription.id,
    });
    // Not a client error — Razorpay will keep retrying. Return 200 so
    // they stop, and we can investigate in the DB.
    return json({ ok: true, ignored: true, reason: "no_user_id" });
  }

  // Fetch the current subscription row for beta fallback decision.
  const { data: existingRow } = await admin
    .from("subscriptions")
    .select("plan, status, beta_expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  const betaExpiresAt = existingRow?.beta_expires_at ?? null;

  // Handle each event type.
  try {
    switch (eventType) {
 
      case "subscription.activated":
      case "subscription.charged": {
        if (requestedPlan !== "discipline" && requestedPlan !== "premium") {
          console.error("Unknown plan in webhook notes", {
            eventId,
            requestedPlan,
          });
          break;
        }
        if (requestedCycle !== "monthly" && requestedCycle !== "annual") {
          console.error("Unknown billing cycle in webhook notes", {
            eventId,
            requestedCycle,
          });
          break;
        }

        const periodEnd = unixToIso(subscription.current_end);

        const { error } = await admin
          .from("subscriptions")
          .update({
            plan: requestedPlan,
            status: "active",
            access_type: "subscription",
            razorpay_subscription_id: subscription.id,
            razorpay_plan_id: subscription.plan_id,
            billing_cycle: requestedCycle,
            current_period_end: periodEnd,
            beta_expires_at: null, // paid plan supersedes beta
          })
          .eq("user_id", userId);

        if (error) {
          console.error("Failed to activate subscription", {
            eventId,
            userId,
            code: error.code,
            message: error.message,
          });
          return json({ error: "db_update_failed" }, 500);
        }

        console.log("Subscription activated", {
          eventId,
          userId,
          plan: requestedPlan,
          cycle: requestedCycle,
          periodEnd,
        });
        break;
      }

      case "subscription.cancelled": {
        // Cancellation means "do not renew". Access continues until
        // current_period_end. Mark status so UI can show "cancels on X".
        const periodEnd = unixToIso(subscription.current_end);

        const { error } = await admin
          .from("subscriptions")
          .update({
            status: "cancelled",
            current_period_end: periodEnd,
          })
          .eq("user_id", userId);

        if (error) {
          console.error("Failed to mark subscription cancelled", {
            eventId,
            userId,
            code: error.code,
            message: error.message,
          });
          return json({ error: "db_update_failed" }, 500);
        }

        console.log("Subscription cancelled", {
          eventId,
          userId,
          periodEnd,
        });
        break;
      }

      case "subscription.halted":
      case "subscription.expired":
      case "subscription.completed": {
        // Payment failed permanently, or the subscription ran its course.
        // Downgrade to free, or beta_pro if their beta window is still open.
        const fallbackPlan = planForSubscriptionEnd(betaExpiresAt);

        const { error } = await admin
          .from("subscriptions")
          .update({
            plan: fallbackPlan,
            status: fallbackPlan === "free" ? "expired" : "active",
            current_period_end: null,
            razorpay_subscription_id: null,
            razorpay_plan_id: null,
            billing_cycle: null,
          })
          .eq("user_id", userId);

        if (error) {
          console.error("Failed to downgrade subscription", {
            eventId,
            userId,
            code: error.code,
            message: error.message,
          });
          return json({ error: "db_update_failed" }, 500);
        }

        console.log("Subscription downgraded", {
          eventId,
          userId,
          fallbackPlan,
          reason: eventType,
        });
        break;
      }

      case "subscription.paused":
      case "subscription.resumed":
      case "subscription.authenticated":
      case "subscription.pending": {
        // Not actionable — access is already governed by plan + status,
        // and none of these states change entitlement.
        console.log("Ignoring informational event", { eventId, eventType });
        break;
      }

      default: {
        console.log("Unhandled webhook event type", { eventId, eventType });
        break;
      }
    }

    return json({ ok: true });
  } catch (err) {
    console.error("Unhandled error while processing webhook", {
      eventId,
      eventType,
      message: err instanceof Error ? err.message : String(err),
    });
    return json({ error: "server_error" }, 500);
  }
});