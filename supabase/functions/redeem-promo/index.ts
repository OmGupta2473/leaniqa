import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { checkPaymentRateLimit, clientIpFrom } from "../_shared/rateLimit.ts";

// TODO(security): tighten to your real origins before public launch.
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

function errJson(error_code: string, error: string, status: number): Response {
  return json({ error, error_code }, status);
}

const CODE_MIN_LEN = 4;
const CODE_MAX_LEN = 40;

interface RedeemBody {
  code: string;
  share_meal_data: boolean;
}

function parseBody(raw: unknown): RedeemBody | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.code !== "string") return null;
  const code = r.code.trim();
  if (code.length < CODE_MIN_LEN || code.length > CODE_MAX_LEN) return null;
  if (r.share_meal_data !== undefined && typeof r.share_meal_data !== "boolean") {
    return null;
  }
  return { code, share_meal_data: r.share_meal_data === true };
}

function rpcErrorMessage(code: string): string {
  switch (code) {
    case "already_redeemed": return "You have already redeemed a gym code.";
    case "invalid_code": return "That code isn't valid. Check the spelling and try again.";
    case "code_inactive": return "That code is no longer active.";
    case "code_exhausted": return "That code has reached its redemption limit.";
    case "not_authenticated": return "Please sign in again.";
    default: return "Could not redeem this code.";
  }
}

// plpgsql RAISE EXCEPTION surfaces verbatim in the PostgREST error.message.
// The RPC in migration 20261105000000 raises one of five strings. The unique
// index on (user_id) in promo_redemptions is a defence-in-depth backstop —
// if the pre-check in the RPC is ever bypassed, Postgres emits 23505 with
// 'promo_redemptions_one_per_user' in the constraint name; treat that as
// already_redeemed too so the client contract stays stable.
function mapRpcError(
  message: string,
  code: string | undefined,
): { error_code: string; status: number } | null {
  if (message.includes("already_redeemed")) return { error_code: "already_redeemed", status: 409 };
  if (message.includes("invalid_code"))      return { error_code: "invalid_code",      status: 404 };
  if (message.includes("code_inactive"))     return { error_code: "code_inactive",     status: 400 };
  if (message.includes("code_exhausted"))    return { error_code: "code_exhausted",    status: 400 };
  if (message.includes("not_authenticated")) return { error_code: "not_authenticated", status: 401 };
  if (code === "23505" && message.includes("promo_redemptions_one_per_user")) {
    return { error_code: "already_redeemed", status: 409 };
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return errJson("method_not_allowed", "Method not allowed", 405);

  const requestId = crypto.randomUUID();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return errJson("missing_auth", "Sign in to redeem a code.", 401);
    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    // User-scoped client: the RPC reads auth.uid() inside its SECURITY
    // DEFINER body, so it MUST be called with the user's JWT. Calling it
    // as service_role would leave auth.uid() null and the function would
    // raise 'not_authenticated'.
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return errJson("invalid_token", "Your session expired. Sign in again.", 401);
    }

    // Guests cannot redeem: premium_until is meaningless for an identity
    // that has no email. Matches the create-razorpay-* convention (they
    // reject guests at 403 too).
    if ((user as { is_anonymous?: boolean }).is_anonymous === true) {
      return errJson(
        "guest_not_allowed",
        "Link Google or email to redeem a gym code.",
        403,
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = parseBody(body);
    if (!parsed) {
      return errJson(
        "invalid_body",
        `A valid code (${CODE_MIN_LEN}–${CODE_MAX_LEN} characters) is required.`,
        400,
      );
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) {
      console.error(JSON.stringify({
        level: "error", stage: "redeem-promo", requestId,
        event: "server_misconfiguration",
      }));
      return errJson("server_misconfiguration", "Server is misconfigured. Contact support.", 500);
    }
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // 5 attempts/min per user, 20/min per IP. Reuses the same helper the
    // checkout endpoints use, with "redeem-promo" as the action key.
    // NOTE (5.1.14 filed below): this is UX, not security — the RPC itself
    // is granted to `authenticated` and can be called directly, bypassing
    // this limit. Acceptable for v1 because promo codes are private
    // distribution; revisit if abuse is observed.
    const rl = await checkPaymentRateLimit(
      admin,
      user.id,
      clientIpFrom(req),
      "redeem-promo",
      5,
      20,
      60,
    );
    if (!rl.allowed) {
      return new Response(
        JSON.stringify({
          error: "Too many attempts. Please wait a minute and try again.",
          error_code: "rate_limited",
        }),
        {
          status: 429,
          headers: {
            ...CORS_HEADERS,
            "Content-Type": "application/json",
            "Retry-After": String(rl.retryAfterSeconds),
          },
        },
      );
    }

    const { data: rows, error: rpcError } = await supabase.rpc("redeem_promo_code", {
      p_code: parsed.code,
      p_share_meal_data: parsed.share_meal_data,
    });

    if (rpcError) {
      const mapped = mapRpcError(rpcError.message ?? "", rpcError.code ?? undefined);
      if (mapped) {
        console.info(JSON.stringify({
          level: "info", stage: "redeem-promo", requestId,
          userId: user.id, event: mapped.error_code,
        }));
        return errJson(mapped.error_code, rpcErrorMessage(mapped.error_code), mapped.status);
      }
      console.error(JSON.stringify({
        level: "error", stage: "redeem-promo", requestId,
        userId: user.id, event: "rpc_failed",
        message: rpcError.message, code: rpcError.code,
      }));
      return errJson("server_error", "Could not redeem this code. Please try again.", 500);
    }

    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row) {
      console.error(JSON.stringify({
        level: "error", stage: "redeem-promo", requestId,
        userId: user.id, event: "empty_result",
      }));
      return errJson("server_error", "Redemption did not return a result. Please try again.", 500);
    }

    console.info(JSON.stringify({
      level: "info", stage: "redeem-promo", requestId,
      userId: user.id, event: "redeemed",
      gym_id: row.gym_id,
      premium_until: row.premium_until,
      share_meal_data: parsed.share_meal_data,
    }));

    return json({
      ok: true,
      gym_id: row.gym_id,
      gym_name: row.gym_name,
      premium_until: row.premium_until,
      share_meal_data: parsed.share_meal_data,
    });
  } catch (err) {
    console.error(JSON.stringify({
      level: "error", stage: "redeem-promo", requestId,
      event: "unhandled",
      message: err instanceof Error ? err.message : String(err),
    }));
    return errJson("server_error", "Server error. Please try again.", 500);
  }
});