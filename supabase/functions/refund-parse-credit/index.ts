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

/**
 * IST date string (YYYY-MM-DD). Computed server-side so the client cannot
 * pass an arbitrary p_date. Matches the date scheme used by the client
 * before this fix and by `parse-meal`'s reserve path.
 *
 * Known limitation (pre-existing, not regressed by this fix): if a user
 * parses at 23:59 IST and clicks Cancel at 00:01 IST, p_date is today but
 * the reserve is on yesterday's row — the RPC will no-op and the credit is
 * not refunded. Fixing this requires `parse-meal` to return its reserve
 * date and the client to pass it back; that is a separate change and is
 * deliberately out of scope here.
 */
function kolkataDateString(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "missing_auth" }, 401);
    const token = authHeader.replace(/^Bearer\s+/i, "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      return json({ error: "server_misconfiguration" }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) return json({ error: "invalid_token" }, 401);

    const body = await req.json().catch(() => null);
    const requestId =
      body && typeof (body as { request_id?: unknown }).request_id === "string"
        ? (body as { request_id: string }).request_id.trim()
        : "";
    if (!requestId) return json({ error: "request_id_required" }, 400);
    if (requestId.length > 100) return json({ error: "invalid_request_id" }, 400);

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) return json({ error: "server_misconfiguration" }, 500);
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const p_date = kolkataDateString();

    const { data, error } = await admin.rpc("refund_api_usage", {
      p_user_id: user.id,
      p_endpoint: "parse-meal",
      p_date,
      p_request_id: requestId,
    });

    if (error) {
      console.error("refund-parse-credit RPC failed", {
        request_id: requestId,
        user_id: user.id,
        p_date,
        error_message: error.message,
        error_code: error.code,
        error_details: error.details,
      });
      return json({ error: "refund_failed", details: error.message }, 500);
    }

    console.log("refund-parse-credit succeeded", {
      request_id: requestId,
      user_id: user.id,
      p_date,
      result: data,
    });

    return json({ ok: true, refunded: true, result: data });
  } catch (err) {
    console.error("Unhandled error in refund-parse-credit", {
      message: err instanceof Error ? err.message : String(err),
    });
    return json({ error: "server_error" }, 500);
  }
});