import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

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
      return json({ error: "Guest accounts cannot request account deletion." }, 403);
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) return json({ error: "server_misconfiguration" }, 500);
    const admin = createClient(supabaseUrl, serviceRoleKey);

    let body: { action?: string };
    try {
      body = await req.json();
    } catch {
      return json({ error: "invalid_body" }, 400);
    }

    const action = body?.action;

    if (action === "request") {
      // Check if a non-cancelled, non-executed request already exists
      const { data: existing, error: fetchError } = await admin
        .from("deletion_requests")
        .select("requested_at, cancelled_at, executed_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchError) {
        console.error("Failed to read deletion request", { error: fetchError.message, userId: user.id });
        return json({ error: "db_error" }, 500);
      }

      if (existing) {
        if (!existing.cancelled_at && !existing.executed_at) {
          // Active request already exists
          return json(
            { error: "Deletion already requested.", error_code: "already_requested", requested_at: existing.requested_at },
            409,
          );
        }
        if (existing.cancelled_at && !existing.executed_at) {
          // Cancelled request exists — reset it
          const { error: updateError } = await admin
            .from("deletion_requests")
            .update({
              requested_at: new Date().toISOString(),
              cancelled_at: null,
              executed_at: null,
            })
            .eq("user_id", user.id);
          if (updateError) {
            console.error("Failed to reset deletion request", { error: updateError.message, userId: user.id });
            return json({ error: "db_error" }, 500);
          }
          return json({ ok: true, requested_at: new Date().toISOString() });
        }
        // executed_at is set — should not happen with unique constraint, but handle gracefully
        return json({ error: "Account deletion already executed.", error_code: "already_executed" }, 409);
      }

      // No existing row — insert new
      const { error: insertError } = await admin
        .from("deletion_requests")
        .insert({ user_id: user.id, requested_at: new Date().toISOString() });
      if (insertError) {
        console.error("Failed to create deletion request", { error: insertError.message, userId: user.id });
        return json({ error: "db_error" }, 500);
      }

      return json({ ok: true, requested_at: new Date().toISOString() });
    }

    if (action === "cancel") {
      const { error: updateError } = await admin
        .from("deletion_requests")
        .update({ cancelled_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .is("executed_at", null);
      if (updateError) {
        console.error("Failed to cancel deletion request", { error: updateError.message, userId: user.id });
        return json({ error: "db_error" }, 500);
      }
      return json({ ok: true });
    }

    return json({ error: "Invalid action. Use 'request' or 'cancel'.", error_code: "invalid_action" }, 400);
  } catch (err) {
    console.error("Unhandled error in request-account-deletion", {
      message: err instanceof Error ? err.message : String(err),
    });
    return json({ error: "Server error. Please try again." }, 500);
  }
});