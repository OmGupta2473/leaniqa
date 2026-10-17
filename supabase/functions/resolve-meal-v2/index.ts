/**
 * Phase 6.7 R2.4 — resolve-meal-v2 edge function.
 *
 * KB-primary resolver. Uses foodResolverV2 (which wires R2.0 prep-strip,
 * R2.1 portion lookup through food_portions, and R2.2 ambiguity signal).
 *
 * NO AI FALLBACK IN THIS PHASE.
 *   - USE_HYBRID_RESOLVER is not read.
 *   - INTERNAL_FUNCTION_SECRET is not read.
 *   - parse-meal is not called.
 *   - No credits are reserved or refunded.
 *   - Response carries ai_used: false on every request.
 *
 * Deployed as `resolve-meal-v2` on staging. Does NOT touch `resolve-meal`
 * (v5), which remains the production and staging default until R2.8 gates
 * the frontend to v2.
 *
 * Response additions vs v5:
 *   - was_ambiguous: boolean
 *   - kb_confidence: number
 *   - ai_used: false
 *   - source: 'v2_kb_primary'
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  resolve,
  normalizeInput,
  DEFAULT_RESOLVER_CONFIG,
  type ResolverDb,
  type ResolverConfig,
  type ResolverResult,
  type FoodRow,
  type AliasRow,
  type AmbiguousCandidate,
  type ScoredAlias,
  type ScoredFood,
  type MealMemoryRow,
  type PopularMealRow,
  type MemoryWrite,
} from "../_shared/foodResolverV2.ts";
import type { FoodPortionRow } from "../_shared/portionLookup.ts";

// =============================================================================
// CORS + JSON helpers
// =============================================================================

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

// =============================================================================
// Request schema (identical to v5)
// =============================================================================

const UserSelectionSchema = z.object({
  input_term: z.string().min(1).max(200),
  food_id: z.number().int().positive(),
});

const RequestSchema = z.object({
  text: z.string().min(1).max(1000),
  mealType: z.string().optional().default("unspecified"),
  seededItems: z
    .array(
      z.object({
        raw_text: z.string(),
        quantity: z.number(),
        unit: z.string().nullable(),
        food_name: z.string(),
        range: z.tuple([z.number(), z.number()]).optional(),
      }),
    )
    .optional(),
  selections: z.array(UserSelectionSchema).max(20).optional(),
});

type RequestBody = z.infer<typeof RequestSchema>;

// =============================================================================
// SupabaseResolverDbV2 — implements all ResolverDb methods including the
// two Phase 6.7 additions (getFoodPortions, getAllAmbiguousTerms).
// =============================================================================

class SupabaseResolverDbV2 implements ResolverDb {
  constructor(private readonly supabase: ReturnType<typeof createClient>) {}

  async getFoodByCanonicalName(canonicalName: string): Promise<FoodRow | null> {
    const { data, error } = await this.supabase
      .from("foods")
      .select("*")
      .eq("canonical_name", canonicalName)
      .order("source_rank", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) return null;
    return (data as FoodRow | null) ?? null;
  }

  async getFoodsByIds(ids: number[]): Promise<FoodRow[]> {
    if (ids.length === 0) return [];
    const { data, error } = await this.supabase
      .from("foods")
      .select("*")
      .in("id", ids);
    if (error) return [];
    return (data ?? []) as FoodRow[];
  }

  async getAliasByKey(alias: string): Promise<AliasRow | null> {
    const { data, error } = await this.supabase
      .from("food_aliases")
      .select("alias, food_id, portion_grams, portion_unit, confidence")
      .eq("alias", alias)
      .order("confidence", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return null;
    return (data as AliasRow | null) ?? null;
  }

  async fuzzySearchAliases(
    term: string,
    limit: number,
    minSimilarity: number,
  ): Promise<ScoredAlias[]> {
    const { data, error } = await this.supabase.rpc("search_food_aliases", {
      p_term: term,
      p_min_sim: minSimilarity,
      p_limit: limit,
    });
    if (error || !data) return [];
    return (data as Array<{
      alias: string;
      food_id: number;
      portion_grams: number | null;
      portion_unit: string | null;
      confidence: number;
      similarity: number;
    }>).map((r) => ({
      alias: {
        alias: r.alias,
        food_id: r.food_id,
        portion_grams: r.portion_grams,
        portion_unit: r.portion_unit,
        confidence: r.confidence,
      },
      similarity: r.similarity,
    }));
  }

  async fuzzySearchFoods(
    term: string,
    limit: number,
    minSimilarity: number,
  ): Promise<ScoredFood[]> {
    const { data, error } = await this.supabase.rpc("search_foods", {
      p_term: term,
      p_min_sim: minSimilarity,
      p_limit: limit,
    });
    if (error || !data) return [];
    const rows = data as Array<{ food_id: number; similarity: number }>;
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.food_id);
    const foods = await this.getFoodsByIds(ids);
    const byId = new Map(foods.map((f) => [f.id, f]));
    return rows
      .map((r) => {
        const food = byId.get(r.food_id);
        return food ? { food, similarity: r.similarity } : null;
      })
      .filter((x): x is ScoredFood => x != null);
  }

  async getAmbiguousCandidates(term: string): Promise<AmbiguousCandidate[]> {
    const { data, error } = await this.supabase
      .from("food_ambiguous_candidates")
      .select("food_id, rank")
      .eq("term", term)
      .order("rank", { ascending: true });
    if (error) return [];
    return (data ?? []) as AmbiguousCandidate[];
  }

  async getMemoryEntry(
    userId: string,
    normalizedText: string,
  ): Promise<MealMemoryRow | null> {
    const { data, error } = await this.supabase
      .from("user_meal_memory")
      .select("*")
      .eq("user_id", userId)
      .eq("normalized_text", normalizedText)
      .maybeSingle();
    if (error) return null;
    return (data as MealMemoryRow | null) ?? null;
  }

  async upsertMemoryEntry(
    userId: string,
    normalizedText: string,
    entry: MemoryWrite,
  ): Promise<void> {
    const { error } = await this.supabase
      .from("user_meal_memory")
      .upsert(
        {
          user_id: userId,
          normalized_text: normalizedText,
          items: entry.items,
          total_kcal: entry.total_kcal,
          total_protein: entry.total_protein,
          total_fat: entry.total_fat,
          total_carbs: entry.total_carbs,
          last_used_at: new Date().toISOString(),
        },
        { onConflict: "user_id,normalized_text" },
      );
    if (error) throw new Error(`memory upsert failed: ${error.message}`);
  }

  async getPopularMeal(normalizedText: string): Promise<PopularMealRow | null> {
    const { data, error } = await this.supabase
      .from("popular_meal_cache")
      .select("*")
      .eq("normalized_text", normalizedText)
      .maybeSingle();
    if (error) return null;
    return (data as PopularMealRow | null) ?? null;
  }

  // ---------------------------------------------------------------------------
  // Phase 6.7 additions
  // ---------------------------------------------------------------------------

  async getFoodPortions(foodId: number): Promise<FoodPortionRow[]> {
    const { data, error } = await this.supabase
      .from("food_portions")
      .select("unit, grams, is_default, confidence")
      .eq("food_id", foodId);
    if (error) return [];
    return (data ?? []).map((r: {
      unit: string;
      grams: number | string;
      is_default: boolean;
      confidence: number | string;
    }) => ({
      unit: r.unit,
      grams: typeof r.grams === "string" ? parseFloat(r.grams) : r.grams,
      is_default: r.is_default,
      confidence: typeof r.confidence === "string" ? parseFloat(r.confidence) : r.confidence,
    }));
  }

  async getAllAmbiguousTerms(): Promise<string[]> {
    const { data, error } = await this.supabase
      .from("food_ambiguous_terms")
      .select("term");
    if (error) return [];
    return (data ?? []).map((r: { term: string }) => r.term);
  }
}

// =============================================================================
// Main handler
// =============================================================================

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  const startedAt = Date.now();

  // ---- 1. Body ------------------------------------------------------------
  let body: RequestBody;
  try {
    body = RequestSchema.parse(await req.json());
  } catch {
    return jsonResponse(
      { error: "Invalid request body", request_id: requestId, error_code: "invalid_body" },
      400,
      corsHeaders,
    );
  }

  // Mutual exclusion: selections vs seededItems (preserved from v5)
  if (
    body.selections && body.selections.length > 0 &&
    body.seededItems && body.seededItems.length > 0
  ) {
    return jsonResponse(
      {
        error: "selections and seededItems are mutually exclusive",
        request_id: requestId,
        error_code: "invalid_body",
      },
      400,
      corsHeaders,
    );
  }

  // ---- 2. Auth ------------------------------------------------------------
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse(
      { error: "Unauthorized: missing Authorization header", request_id: requestId, error_code: "unauthorized" },
      401,
      corsHeaders,
    );
  }
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: authError } = await supabase.auth.getUser(token);
  const user = userData?.user;
  if (authError || !user) {
    return jsonResponse(
      { error: "Unauthorized: invalid token", request_id: requestId, error_code: "unauthorized" },
      401,
      corsHeaders,
    );
  }

  // ---- 3. Resolve (KB-primary only) ---------------------------------------
  const config: ResolverConfig = { ...DEFAULT_RESOLVER_CONFIG };
  const db = new SupabaseResolverDbV2(supabase);

  let result: ResolverResult;
  try {
    result = await resolve(
      {
        userId: user.id,
        rawText: body.text,
        normalizedText: normalizeInput(body.text),
        mealType: body.mealType,
        seededItems: body.seededItems,
        selections: body.selections,
      },
      db,
      config,
    );
  } catch (err) {
    console.error(JSON.stringify({
      level: "error",
      stage: "resolve-meal-v2",
      event: "local_resolve_failed",
      request_id: requestId,
      message: err instanceof Error ? err.message : String(err),
    }));
    try {
      await supabase.from("meal_resolution_log").insert({
        user_id: user.id,
        normalized_text: normalizeInput(body.text),
        result: { error: "local_resolve_failed" },
        layers_used: [],
        ai_fallback: false,
        overall_confidence: 0,
        resolution_ms: Date.now() - startedAt,
      });
    } catch { /* ignore */ }
    return jsonResponse(
      { error: "Unable to resolve meal right now. Please try again.", request_id: requestId, error_code: "resolve_failed" },
      500,
      corsHeaders,
    );
  }

  // ---- 4. Log -------------------------------------------------------------
  try {
    await supabase.from("meal_resolution_log").insert({
      user_id: user.id,
      normalized_text: normalizeInput(body.text),
      result,
      layers_used: result.layers_used,
      ai_fallback: false,
      overall_confidence: result.meal_confidence,
      resolution_ms: Date.now() - startedAt,
    });
  } catch (err) {
    console.error(JSON.stringify({
      level: "error",
      stage: "resolve-meal-v2",
      event: "log_write_failed",
      message: err instanceof Error ? err.message : String(err),
    }));
  }

  // ---- 5. Response --------------------------------------------------------
  return jsonResponse(
    {
      ...result,
      source: "v2_kb_primary",
      request_id: requestId,
    },
    200,
    corsHeaders,
  );
});