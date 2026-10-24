/**
 * AI-only meal estimator. Replaces the KB-primary resolver for the
 * `resolve-meal-v2` endpoint during the AI-only pivot.
 *
 * Contract:
 *   - Takes raw meal text + meal slot.
 *   - Returns validated items[] with per-item macros.
 *   - Totals are RECOMPUTED here from items; the AI's own `totals` field
 *     is advisory and is discarded.
 *   - No food_id, no KB lookup, no aliases, no memory. Pure AI.
 *
 * Failure modes:
 *   - No API key → returns null
 *   - Timeout / 4xx / 5xx → one retry, then null
 *   - Malformed JSON / schema violation → null
 *   - Any item with NaN/negative macros → drop that item; if zero items
 *     remain, return null (do NOT return a zero-calorie meal)
 */

import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// ---------------------------------------------------------------------------
// Public response contract (also mirrored in the frontend types)
// ---------------------------------------------------------------------------

export interface AiMealItem {
  label: string;
  quantity: number;
  unit: string | null;
  grams: number;
  preparation: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  oil_included: boolean;
  note: string | null;
}

export interface AiMealTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface AiMealEstimate {
  meal_title: string;
  meal_style: "homemade" | "street-side" | "restaurant" | "other";
  assumptions: string[];
  items: AiMealItem[];
  totals: AiMealTotals;
  confidence: number;
  needs_review: boolean;
  clarifying_questions: string[];
}

// ---------------------------------------------------------------------------
// Zod schema — validates what Gemini returns before we trust it
// ---------------------------------------------------------------------------

const AiMealItemSchema = z.object({
  label: z.string().min(1).max(200),
  quantity: z.number().finite().nonnegative().max(1000),
  unit: z.string().max(30).nullable(),
  grams: z.number().finite().nonnegative().max(5000),
  preparation: z.string().max(50).nullable(),
  calories: z.number().finite().nonnegative().max(10000),
  protein: z.number().finite().nonnegative().max(500),
  carbs: z.number().finite().nonnegative().max(800),
  fat: z.number().finite().nonnegative().max(500),
  fiber: z.number().finite().nonnegative().max(200),
  oil_included: z.boolean(),
  note: z.string().max(500).nullable(),
});

const AiMealEstimateSchema = z.object({
  meal_title: z.string().min(1).max(200),
  meal_style: z.enum(["homemade", "street-side", "restaurant", "other"]),
  assumptions: z.array(z.string().min(1).max(500)).max(20),
  items: z.array(AiMealItemSchema).min(1).max(20),
  confidence: z.number().finite().min(0).max(100),
  needs_review: z.boolean(),
  clarifying_questions: z.array(z.string().max(300)).max(5),
});

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

export function buildAiOnlyPrompt(mealText: string, mealSlot: string): string {
  return `You are a precise nutrition estimator for Indian and international foods.

The user typed this meal: "${mealText}"
Meal slot: ${mealSlot}

Return JSON only, exactly this shape:
{
  "meal_title": "<short human-readable title, e.g. '2 Rotis + Dal + Boiled Eggs'>",
  "meal_style": "homemade | street-side | restaurant | other",
  "assumptions": [
    "<one bullet per assumption — portions, prep, oil, anything you inferred>",
    "<MUST include at least one bullet acknowledging what you did NOT add>"
  ],
  "items": [
    {
      "label": "<short human label, e.g. '2 rotis' or '1 bowl dal'>",
      "quantity": <number>,
      "unit": "<piece | g | ml | bowl | cup | slice | tbsp | tsp | null>",
      "grams": <number, consumed weight in grams>,
      "preparation": "<plain | fried | boiled | grilled | roasted | steamed | null>",
      "calories": <number>,
      "protein": <number, grams>,
      "carbs": <number, grams>,
      "fat": <number, grams>,
      "fiber": <number, grams>,
      "oil_included": <true if cooking fat is included in this item's macros>,
      "note": "<string or null — anything extra the user should know>"
    }
  ],
  "confidence": <0-100>,
  "needs_review": <true ONLY if the meal is genuinely unparseable>,
  "clarifying_questions": ["<up to 3 short questions, only if needs_review is true>"]
}

Rules:
1. Assumptions are MANDATORY. Always explain portions, prep, and oil.
2. If the user did NOT mention oil or ghee, DO NOT add it. Set oil_included=false
   unless the dish is inherently oil-based (samosa, puri, paratha, biryani, curry).
3. If portion is vague ("a bowl of dal", "some rice"), pick a standard serving
   and say so in assumptions. Do NOT set needs_review for this.
4. Set needs_review=true ONLY for gibberish, contradictory info, or missing
   protein source that makes the meal impossible to estimate.
5. Every item must have positive grams. Never return a zero-calorie meal.
6. Preserve Indian portion words: katori = 1 bowl (~150g), roti = 1 piece (~40g),
   glass = 240ml, cup of tea = 150ml.
7. Do NOT invent foods the user did not mention. If the user said "dal and roti",
   items must be dal and roti only — no rice, no salad.
8. Do NOT double-count oil. If you set oil_included=true on a dish, do NOT
   also list a separate "1 tsp oil" item.
9. Macros must be internally consistent: for each item,
   (protein*4 + carbs*4 + fat*9) should be within ~30% of calories.
10. Round calories to integers, macros to 1 decimal place.

Return exactly one JSON object. No markdown, no code fences, no explanation.`;
}

// ---------------------------------------------------------------------------
// Backend-side total recomputation + item sanitization
// ---------------------------------------------------------------------------

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Recompute totals from validated items. Discards the AI's own `totals`
 * entirely — this is the single source of truth for what gets saved.
 *
 * Dropping rules (never return zero-calorie):
 *   - item.grams <= 0             → drop
 *   - item.calories <= 0 AND all macros <= 0 → drop
 *   - item.calories <= 0 BUT macros > 0     → recompute calories from macros
 *   - after drops, if items[] empty → return null
 */
export function recomputeTotals(
  items: AiMealItem[],
): { items: AiMealItem[]; totals: AiMealTotals } | null {
  const kept: AiMealItem[] = [];

  for (const item of items) {
    if (item.grams <= 0) continue;
    const macroSum = item.protein + item.carbs + item.fat + item.fiber;
    if (item.calories <= 0 && macroSum <= 0) continue;

    // If AI returned calories=0 but macros positive, derive calories from macros
    const safeCalories =
      item.calories > 0
        ? item.calories
        : Math.round(item.protein * 4 + item.carbs * 4 + item.fat * 9);

    // Cap runaway items (hallucination guard)
    const cappedCalories = Math.min(safeCalories, 5000);

    kept.push({
      ...item,
      calories: Math.round(cappedCalories),
      protein: round1(item.protein),
      carbs: round1(item.carbs),
      fat: round1(item.fat),
      fiber: round1(item.fiber),
    });
  }

  if (kept.length === 0) return null;

  const totals: AiMealTotals = {
    calories: Math.round(kept.reduce((s, i) => s + i.calories, 0)),
    protein: round1(kept.reduce((s, i) => s + i.protein, 0)),
    carbs: round1(kept.reduce((s, i) => s + i.carbs, 0)),
    fat: round1(kept.reduce((s, i) => s + i.fat, 0)),
    fiber: round1(kept.reduce((s, i) => s + i.fiber, 0)),
  };

  return { items: kept, totals };
}

/**
 * Post-parse drift checks that flip `needs_review` from false to true when
 * something looks suspicious. Never turns false→true→false; only escalates.
 */
export function escalateReviewFlags(
  base: AiMealEstimate,
  mealText: string,
): AiMealEstimate {
  let needsReview = base.needs_review;
  const reasons: string[] = [...base.clarifying_questions];

  // 1. Too many items for a short text = hallucination risk
  const wordCount = mealText.trim().split(/\s+/).length;
  if (base.items.length > 6 && wordCount < 6) {
    needsReview = true;
    reasons.push(
      "Parsed many items from a short description — please verify the breakdown.",
    );
  }

  // 2. Any item over 2000 kcal suggests an estimation error
  if (base.items.some((i) => i.calories > 2000)) {
    needsReview = true;
    reasons.push("One item has very high calories — check the portion.");
  }

  return {
    ...base,
    needs_review: needsReview,
    clarifying_questions: reasons.slice(0, 3),
  };
}

// ---------------------------------------------------------------------------
// Gemini adapter (single provider; interface ready for future providers)
// ---------------------------------------------------------------------------

const GEMINI_MODEL = "gemini-flash-latest";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const TIMEOUT_MS = 12_000;

export interface AiOnlyEstimateResult {
  estimate: AiMealEstimate | null;
  provider: "gemini";
  request_id: string;
  error_code?: string;
}

export interface AiOnlyEstimator {
  provider(): string;
  estimate(mealText: string, mealSlot: string): Promise<AiOnlyEstimateResult>;
}

export class GeminiAiOnlyEstimator implements AiOnlyEstimator {
  constructor(private readonly apiKey: string | undefined) {}

  provider(): string {
    return "gemini";
  }

  async estimate(mealText: string, mealSlot: string): Promise<AiOnlyEstimateResult> {
    const requestId = crypto.randomUUID();

    if (!this.apiKey) {
      console.error(
        JSON.stringify({
          level: "error",
          stage: "GeminiAiOnly",
          event: "missing_secret",
          request_id: requestId,
        }),
      );
      return { estimate: null, provider: "gemini", request_id: requestId, error_code: "missing_secret" };
    }

    const prompt = buildAiOnlyPrompt(mealText, mealSlot);

    let text = await this.callOnce(prompt, requestId);
    if (text === null) {
      // One bounded retry on timeout / 429 / 503.
      text = await this.callOnce(prompt, `${requestId}:retry`);
    }
    if (text === null) {
      return { estimate: null, provider: "gemini", request_id: requestId, error_code: "provider_error" };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error(
        JSON.stringify({
          level: "error",
          stage: "GeminiAiOnly",
          event: "invalid_json",
          request_id: requestId,
        }),
      );
      return { estimate: null, provider: "gemini", request_id: requestId, error_code: "invalid_response" };
    }

    const schemaResult = AiMealEstimateSchema.safeParse(parsed);
    if (!schemaResult.success) {
      console.error(
        JSON.stringify({
          level: "error",
          stage: "GeminiAiOnly",
          event: "schema_rejected",
          request_id: requestId,
          issues: schemaResult.error.issues.slice(0, 3),
        }),
      );
      return { estimate: null, provider: "gemini", request_id: requestId, error_code: "invalid_response" };
    }

    const totalsResult = recomputeTotals(schemaResult.data.items);
    if (!totalsResult) {
      console.error(
        JSON.stringify({
          level: "error",
          stage: "GeminiAiOnly",
          event: "no_valid_items",
          request_id: requestId,
        }),
      );
      return { estimate: null, provider: "gemini", request_id: requestId, error_code: "invalid_response" };
    }

    const estimate = escalateReviewFlags(
      {
        ...schemaResult.data,
        items: totalsResult.items,
        totals: totalsResult.totals,
      },
      mealText,
    );

    return { estimate, provider: "gemini", request_id: requestId };
  }

  private async callOnce(prompt: string, label: string): Promise<string | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const startedAt = Date.now();
    try {
      const response = await fetch(GEMINI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey!,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
            maxOutputTokens: 4096,
          },
        }),
        signal: controller.signal,
      });
      if (response.status === 429 || response.status === 503) {
        console.warn(
          JSON.stringify({
            level: "warn",
            stage: "GeminiAiOnly",
            event: "retryable_status",
            status: response.status,
            request_id: label,
          }),
        );
        return null;
      }
      if (!response.ok) {
        console.error(
          JSON.stringify({
            level: "error",
            stage: "GeminiAiOnly",
            event: "http_error",
            status: response.status,
            request_id: label,
          }),
        );
        return null;
      }
      const body = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text =
        body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
      if (!text) {
        console.error(
          JSON.stringify({
            level: "error",
            stage: "GeminiAiOnly",
            event: "empty_response",
            request_id: label,
          }),
        );
        return null;
      }
      console.log(
        JSON.stringify({
          level: "info",
          stage: "GeminiAiOnly",
          event: "response_received",
          status: response.status,
          latency_ms: Date.now() - startedAt,
          request_id: label,
        }),
      );
      return text;
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === "AbortError";
      console.error(
        JSON.stringify({
          level: "error",
          stage: "GeminiAiOnly",
          event: aborted ? "timeout" : "request_failed",
          request_id: label,
        }),
      );
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}