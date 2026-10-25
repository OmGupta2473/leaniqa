import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

serve(async (req) => {
  const requestId = crypto.randomUUID();

  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  // 1. Verify cron secret
  const providedSecret = req.headers.get("x-cron-secret") ?? "";
  const expectedSecret = Deno.env.get("ACCOUNT_DELETION_CRON_SECRET");

  if (!expectedSecret) {
    console.error("ACCOUNT_DELETION_CRON_SECRET not configured", { requestId });
    return json({ error: "server_misconfiguration" }, 500);
  }

  if (!constantTimeEquals(providedSecret, expectedSecret)) {
    console.warn("Invalid cron secret", { requestId });
    return json({ error: "unauthorized" }, 401);
  }

  // 2. Build admin client
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY", { requestId });
    return json({ error: "server_misconfiguration" }, 500);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 3. Select due requests
  const cutoffIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: dueRows, error: selectError } = await admin
    .from("deletion_requests")
    .select("user_id, requested_at")
    .is("cancelled_at", null)
    .is("executed_at", null)
    .lt("requested_at", cutoffIso)
    .order("requested_at", { ascending: true })
    .limit(25);

  if (selectError) {
    console.error("Failed to select due deletion requests", {
      requestId,
      error: selectError.message,
    });
    return json({ error: "db_error" }, 500);
  }

  if (!dueRows || dueRows.length === 0) {
    console.log("No due deletion requests", { requestId });
    return json({ ok: true, processed: 0, deleted: 0, failed: 0, skipped: 0 });
  }

  let deleted = 0;
  let failed = 0;
  let skipped = 0;

  // 4. Process each row
  for (const row of dueRows) {
    const userId = row.user_id;

    // 4a. CLAIM the row
    const { data: claimData, error: claimError } = await admin
      .from("deletion_requests")
      .update({ executed_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("executed_at", null)
      .is("cancelled_at", null)
      .select("user_id");

    if (claimError || !claimData || claimData.length === 0) {
      console.log("Deletion request already claimed or cancelled", {
        requestId,
        userId,
        skipped: true,
      });
      skipped++;
      continue;
    }

    let razorpayCancelled = false;

    // 4b. Best-effort Razorpay cancel
    const { data: sub } = await admin
      .from("subscriptions")
      .select("razorpay_subscription_id, status, current_period_end")
      .eq("user_id", userId)
      .maybeSingle();

    if (sub?.razorpay_subscription_id) {
      const shouldCancel =
        sub.status === "active" ||
        (sub.status === "cancelled" &&
          sub.current_period_end &&
          new Date(sub.current_period_end) > new Date());

      if (shouldCancel) {
        const keyId = Deno.env.get("RAZORPAY_KEY_ID");
        const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

        if (keyId && keySecret) {
          const basicAuth = btoa(`${keyId}:${keySecret}`);
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          try {
            const rzpRes = await fetch(
              `https://api.razorpay.com/v1/subscriptions/${sub.razorpay_subscription_id}/cancel`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Basic ${basicAuth}`,
                },
                body: JSON.stringify({ cancel_at_cycle_end: 0 }),
                signal: controller.signal,
              }
            );
            clearTimeout(timeoutId);

            if (rzpRes.ok) {
              razorpayCancelled = true;
              console.log("Razorpay subscription cancelled for account deletion", {
                requestId,
                userId,
                subscriptionId: sub.razorpay_subscription_id,
              });
            } else {
              const errBody = await rzpRes.text().catch(() => "");
              console.error("Razorpay cancel failed for account deletion", {
                requestId,
                userId,
                subscriptionId: sub.razorpay_subscription_id,
                status: rzpRes.status,
                body: errBody.slice(0, 500),
              });
            }
          } catch (fetchErr) {
            clearTimeout(timeoutId);
            console.error("Razorpay cancel network error for account deletion", {
              requestId,
              userId,
              subscriptionId: sub.razorpay_subscription_id,
              message: fetchErr instanceof Error ? fetchErr.message : String(fetchErr),
            });
          }
        }
      }
    }

    // 4c. Delete the auth user (hard delete)
    try {
      const { error: deleteError } = await admin.auth.admin.deleteUser(userId, false);

      if (deleteError) {
        const msg = deleteError.message ?? "";
        const isNotFound =
          msg.includes("User not found") ||
          msg.includes("404") ||
          (deleteError as { status?: number }).status === 404;

        if (isNotFound) {
          // Treat as success — account already gone
          deleted++;
          console.log("Account already deleted (not found)", {
            requestId,
            userId,
          });
        } else {
          // Revert claim on any other error
          await admin
            .from("deletion_requests")
            .update({ executed_at: null })
            .eq("user_id", userId);
          failed++;
          console.error("Failed to delete auth user", {
            requestId,
            userId,
            error: msg,
          });
        }
      } else {
        deleted++;
        console.log("Account deleted successfully", {
          requestId,
          userId,
          razorpayCancelled,
        });
      }
    } catch (err) {
      // Revert claim on exception
      await admin
        .from("deletion_requests")
        .update({ executed_at: null })
        .eq("user_id", userId);
      failed++;
      console.error("Exception while deleting auth user", {
        requestId,
        userId,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return json({
    ok: true,
    processed: dueRows.length,
    deleted,
    failed,
    skipped,
  });
});