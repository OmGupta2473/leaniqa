/**
 * resolve-meal-v2 — AI-only meal estimator.
 *
 * PIVOT NOTE: This endpoint used to run the KB-primary resolver
 * (foodResolverV2) with an optional AI fallback. During the AI-only
 * pivot it calls GeminiAiOnlyEstimator directly for every request.
 *
 * The KB tables, KB resolver code, and `resolve-meal` v5 all remain
 * deployed and untouched. To roll back, restore the pre-pivot version
 * of this file from git and redeploy — no data migration required.
 *
 * Credit accounting:
 *   - 1 credit reserved on every request (endpoint key: 'parse-meal' to
 *     keep the daily counter unified with the legacy parse-meal path).
 *   - Refunded automatically on AI failure.
 *   - `credits` is included in the success response.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  GeminiAiOnlyEstimator,
  type AiOnlyEstimateResult,
} from "../_shared/aiOnlyMealEstimator.ts";

// ---------------------------------------------------------------------------
// CORS + helpers
// ---------------------------------------------------------------------------

function getCorsHeaders(req: Request) {
  return {
    "Access-Control-Allow-Origin": req.headers.get("Origin") || "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, baggage, sentry-trace",
  };
}

function jsonResponse(
  body: unknown,
  status: number,
  corsHeaders: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function readJwtClaims(
  authorization: string | null,
): { is_anonymous?: boolean } | null {
  const token = authorization?.replace(/^Bearer\s+/i, "");
  const payload = token?.split(".")[1];
  if (!payload) return null;
  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json) as { is_anonymous?: boolean };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Request schema — accept both old and new field names for rollout safety
// ---------------------------------------------------------------------------

const RequestSchema = z.object({
  text: z.string().min(1).max(1000),
  mealType: z.string().optional().default("unspecified"),
  // Legacy KB fields. Present in old clients, ignored here.
  seededItems: z.unknown().optional(),
  selections: z.unknown().optional(),
});

type RequestBody = z.infer<typeof RequestSchema>;

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse(
      { error: "method_not_allowed", error_code: "method_not_allowed" },
      405,
      corsHeaders,
    );
  }

  const startedAt = Date.now();
  const requestId = crypto.randomUUID();

  // ---- 1. Parse body ----
  let body: RequestBody;
  try {
    body = RequestSchema.parse(await req.json());
  } catch {
    return jsonResponse(
      {
        error: "Invalid request body",
        request_id: requestId,
        error_code: "invalid_body",
      },
      400,
      corsHeaders,
    );
  }

  // ---- 2. Auth ----
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse(
      {
        error: "Unauthorized: missing Authorization header",
        request_id: requestId,
        error_code: "unauthorized",
      },
      401,
      corsHeaders,
    );
  }
  const token = authHeader.replace(/^Bearer\s+/i, "");

  const claims = readJwtClaims(authHeader);
  if (claims?.is_anonymous === true) {
    return jsonResponse(
      {
        error:
          "AI parsing requires a permanent account. Link Google or email to continue.",
        error_code: "guest_ai_blocked",
        request_id: requestId,
      },
      403,
      corsHeaders,
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: authError } = await supabase.auth.getUser(token);
  const user = userData?.user;
  if (authError || !user) {
    return jsonResponse(
      {
        error: "Unauthorized: invalid token",
        request_id: requestId,
        error_code: "unauthorized",
      },
      401,
      corsHeaders,
    );
  }

  // ---- 3. Resolve daily limit from plan ----
  const { data: accessRows, error: accessError } = await supabase.rpc(
    "resolve_user_access",
    { p_user_id: user.id },
  );
  if (accessError) {
    console.error(
      JSON.stringify({
        level: "error",
        stage: "resolve-meal-v2",
        event: "resolve_access_failed",
        request_id: requestId,
        message: accessError.message,
      }),
    );
  }
  const accessRow = Array.isArray(accessRows) ? accessRows[0] : accessRows;
  const hasAccess = accessRow?.has_access === true;
  const tier = typeof accessRow?.tier === "string" ? accessRow.tier : "free";
  const limit = !hasAccess
    ? 5
    : tier === "premium"
    ? 100
    : tier === "discipline"
    ? 25
    : 5;

  const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // ---- 4. Reserve credit (endpoint key: parse-meal to unify counter) ----
  const endpoint = "parse-meal";
  const aiRequestId = crypto.randomUUID();

  const { data: reserveData, error: reserveErr } = await supabase.rpc(
    "reserve_api_usage",
    {
      p_user_id: user.id,
      p_endpoint: endpoint,
      p_date: today,
      p_limit: limit,
    },
  );

  if (reserveErr) {
    console.error(
      JSON.stringify({
        level: "error",
        stage: "resolve-meal-v2",
        event: "reserve_failed",
        request_id: requestId,
        message: reserveErr.message,
      }),
    );
    return jsonResponse(
      {
        error: "Unable to reserve AI credits right now. Please try again.",
        error_code: "reserve_failed",
        request_id: requestId,
      },
      500,
      corsHeaders,
    );
  }

  const reserveRows = Array.isArray(reserveData)
    ? reserveData
    : reserveData
    ? [reserveData]
    : [];
  if (reserveRows.length === 0) {
    return jsonResponse(
      {
        error: "Daily AI limit reached",
        error_code: "daily_limit",
        request_id: requestId,
      },
      429,
      corsHeaders,
    );
  }
  const reservedRow = reserveRows[0] as {
    usage_count?: number;
    limit_value?: number;
  };
  const usedAfterReserve = reservedRow.usage_count ?? 0;

  // ---- 5. Call AI ----
  const estimator = new GeminiAiOnlyEstimator(Deno.env.get("GEMINI_API_KEY"));
  const aiResult: AiOnlyEstimateResult = await estimator.estimate(
    body.text,
    body.mealType,
  );

  // ---- 6. Failure path — refund + return error ----
  if (!aiResult.estimate) {
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const refundClient = serviceRoleKey
      ? createClient(supabaseUrl, serviceRoleKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : supabase;

    const { error: refundErr } = await refundClient.rpc("refund_api_usage", {
      p_user_id: user.id,
      p_endpoint: endpoint,
      p_date: today,
      p_request_id: aiRequestId,
    });

    if (refundErr) {
      console.error(
        JSON.stringify({
          level: "error",
          stage: "resolve-meal-v2",
          event: "refund_failed",
          request_id: requestId,
          message: refundErr.message,
        }),
      );
    } else {
      console.log(
        JSON.stringify({
          level: "info",
          stage: "resolve-meal-v2",
          event: "ai_credit_refunded",
          request_id: requestId,
          ai_request_id: aiRequestId,
        }),
      );
    }

    // Best-effort log for post-mortem (never blocks the response)
    try {
      await supabase.from("meal_resolution_log").insert({
        user_id: user.id,
        normalized_text: body.text.trim().toLowerCase(),
        result: {
          ai_error: aiResult.error_code ?? "unknown",
          request_id: requestId,
        },
        layers_used: [],
        ai_fallback: true,
        overall_confidence: 0,
        resolution_ms: Date.now() - startedAt,
      });
    } catch {
      /* ignore */
    }

    const message =
      aiResult.error_code === "invalid_response"
        ? "The AI returned an invalid estimate. Please rephrase your meal or add quantities."
        : "Could not estimate this meal right now. Please try again.";

    return jsonResponse(
      {
        error: message,
        error_code: aiResult.error_code ?? "provider_error",
        request_id: requestId,
      },
      502,
      corsHeaders,
    );
  }

  const estimate = aiResult.estimate;

  // ---- 7. Success — log, then return ----
  try {
    await supabase.from("meal_resolution_log").insert({
      user_id: user.id,
      normalized_text: body.text.trim().toLowerCase(),
      result: {
        ...estimate,
        source: "ai_only",
      },
      layers_used: ["ai_only"],
      ai_fallback: true,
      overall_confidence: estimate.confidence / 100,
      resolution_ms: Date.now() - startedAt,
    });
  } catch (logErr) {
    console.error(
      JSON.stringify({
        level: "error",
        stage: "resolve-meal-v2",
        event: "log_insert_failed",
        request_id: requestId,
        message: logErr instanceof Error ? logErr.message : String(logErr),
      }),
    );
    // Non-fatal — log failure must not break the user's response.
  }

  return jsonResponse(
    {
      ...estimate,
      source: "ai",
      request_id: requestId,
      credits: {
        used: usedAfterReserve,
        limit,
        remaining: Math.max(0, limit - usedAfterReserve),
      },
    },
    200,
    corsHeaders,
  );
});