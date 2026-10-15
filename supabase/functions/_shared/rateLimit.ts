import { createClient } from "jsr:@supabase/supabase-js@2";

export interface RateLimitResult {
  allowed: boolean;
  currentCount: number;
  retryAfterSeconds: number;
}

/**
 * Checks both per-user and per-IP rate limits. Both must pass.
 * Identifier format:
 *   user:<uuid>
 *   ip:<ip>
 */
export async function checkPaymentRateLimit(
  admin: ReturnType<typeof createClient>,
  userId: string,
  clientIp: string | null,
  endpoint: string,
  userLimit: number,
  ipLimit: number,
  windowSeconds = 60,
): Promise<RateLimitResult> {
  // Per-user check
  const userRes = await admin.rpc("check_rate_limit", {
    p_identifier: `user:${userId}`,
    p_endpoint: endpoint,
    p_max_requests: userLimit,
    p_window_seconds: windowSeconds,
  });

  if (userRes.error) {
    console.error("rate_limit_rpc_failed", {
      identifier: `user:${userId}`,
      endpoint,
      error: userRes.error.message,
    });
    // Fail open — a broken rate limiter must not block payments.
    return { allowed: true, currentCount: 0, retryAfterSeconds: 0 };
  }

  const userRow = Array.isArray(userRes.data) ? userRes.data[0] : userRes.data;
  if (!userRow?.allowed) {
    return {
      allowed: false,
      currentCount: userRow?.current_count ?? userLimit,
      retryAfterSeconds: windowSeconds,
    };
  }

  // Per-IP check (defense against a single user rotating accounts)
  if (clientIp) {
    const ipRes = await admin.rpc("check_rate_limit", {
      p_identifier: `ip:${clientIp}`,
      p_endpoint: endpoint,
      p_max_requests: ipLimit,
      p_window_seconds: windowSeconds,
    });

    if (ipRes.error) {
      console.error("rate_limit_rpc_failed_ip", {
        identifier: `ip:${clientIp}`,
        endpoint,
        error: ipRes.error.message,
      });
      return { allowed: true, currentCount: 0, retryAfterSeconds: 0 };
    }

    const ipRow = Array.isArray(ipRes.data) ? ipRes.data[0] : ipRes.data;
    if (!ipRow?.allowed) {
      return {
        allowed: false,
        currentCount: ipRow?.current_count ?? ipLimit,
        retryAfterSeconds: windowSeconds,
      };
    }
  }

  return { allowed: true, currentCount: userRow?.current_count ?? 1, retryAfterSeconds: 0 };
}

export function clientIpFrom(req: Request): string | null {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null
  );
}