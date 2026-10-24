/**
 * R3.1 — batched AI fallback for unresolved meal items.
 *
 * One Gemini call per meal. Candidate list is built by the caller (only the
 * top 5–10 KB candidates per item). Response is parsed strictly per item;
 * one invalid item never fails the whole batch.
 *
 * Credits: reserved and refunded by the caller (`resolve-meal-v2`), not here.
 * This module exposes the `AiItemEstimator` interface so R3.3 can swap the
 * provider.
 */

export interface AiCandidate {
  food_id: number;
  canonical_name: string;
  display_name: string;
  category: string | null;
  kcal_per_100g: number;
  protein_per_100g: number;
  fat_per_100g: number;
  carbs_per_100g: number;
  fiber_per_100g: number;
  default_portion_grams: number | null;
  default_portion_label: string | null;
  oil_included: boolean;
}

export interface AiEstimateInputItem {
  input_index: number;
  raw_text: string;
  food_name: string;
  preparation_flags: string[];
  conflict: {
    leadingQty: number;
    trailingGrams: number;
    trailingUnit: 'g' | 'ml';
    foodNameWithoutQty: string;
  } | null;
  candidates: AiCandidate[];
}

export interface AiDirectMacros {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
}

export interface AiItemEstimate {
  input_index: number;
  selected_food_id: number | null;
  estimated_grams: number;
  food_label: string;
  direct_macros?: AiDirectMacros;
  note: string;
}

export interface AiEstimateResult {
  results: AiItemEstimate[];
  provider: 'gemini';
  request_id: string;
}

export interface AiItemEstimator {
  provider(): string;
  estimate(items: AiEstimateInputItem[]): Promise<AiEstimateResult>;
}

// ---------------------------------------------------------------------------
// Preparation flags
// ---------------------------------------------------------------------------

const PREP_FLAG_REGEX =
  /\b(raw|uncooked|dry|fried|roasted|grilled|tandoori|homemade|restaurant|street-side)\b/gi;

export function prepFlagsFor(rawText: string): string[] {
  const matches = rawText.match(PREP_FLAG_REGEX);
  if (!matches) return [];
  return Array.from(new Set(matches.map((m) => m.toLowerCase())));
}

// ---------------------------------------------------------------------------
// Prompt builder (single batched prompt for all items needing AI)
// ---------------------------------------------------------------------------

export function buildBatchPrompt(items: AiEstimateInputItem[]): string {
  const inputJson = JSON.stringify(items, null, 2);
  return `You are a nutrition estimator for Indian and international foods.
A user logged a meal. Some items were not confidently resolved to our
database. For each item, choose the best KB candidate OR estimate directly.

Input items (JSON):
${inputJson}

Rules:
1. Return JSON only. No markdown, no code fences, no commentary.
2. Return one object per input_index.
3. Prefer selecting an existing candidate.
4. If a candidate clearly matches, return:
   { "input_index": <n>, "selected_food_id": <candidate.food_id>,
     "estimated_grams": <n>, "food_label": "<short>", "note": "<one line>" }
5. If no candidate fits, return:
   { "input_index": <n>, "selected_food_id": null, "estimated_grams": <n>,
     "food_label": "<short>",
     "direct_macros": { "kcal": <n>, "protein_g": <n>, "carbs_g": <n>,
                        "fat_g": <n>, "fiber_g": <n> },
     "note": "<one line>" }
6. If you cannot estimate, return:
   { "input_index": <n>, "selected_food_id": null, "estimated_grams": 0,
     "food_label": "<fallback>", "note": "" }
7. estimated_grams must reflect the user's portion. Never default to 100g
   unless the user said 100g.
8. Preserve preparation context: raw/uncooked/dry/fried/roasted/grilled/
   tandoori/homemade/restaurant/street-side.
9. Do not add foods the user did not mention.
10. Do not add oil or ghee unless the user explicitly mentioned it OR the
    selected candidate has oil_included = true.
11. If the selected candidate has oil_included = true, note MUST say:
    "Using <profile>; cooking fat included in profile."
12. If you assume a per-piece weight, state it in the note
    (e.g. "Assumed ~40g per piece").
13. If a "conflict" object is present, reconcile and state your
    interpretation in the note.
14. Every successful result must have a non-empty note.

Return exactly: { "items": [ ... ] }`;
}

// ---------------------------------------------------------------------------
// Response parsing + per-item validation (one bad item never fails the batch)
// ---------------------------------------------------------------------------

export function validateAiItem(
  ai: AiItemEstimate,
  candidateIds: ReadonlySet<number>,
): boolean {
  if (!ai.food_label || ai.food_label.trim().length === 0) return false;
  if (!ai.note || ai.note.trim().length === 0) return false;
  if (!(ai.estimated_grams > 0) || ai.estimated_grams > 5000) return false;

  if (ai.selected_food_id != null) {
    return candidateIds.has(ai.selected_food_id);
  }

  const dm = ai.direct_macros;
  if (!dm) return false;
  if (!Number.isFinite(dm.kcal) || dm.kcal < 0 || dm.kcal > 5000) return false;
  if (!Number.isFinite(dm.protein_g) || dm.protein_g < 0 || dm.protein_g > 500) return false;
  if (!Number.isFinite(dm.carbs_g) || dm.carbs_g < 0 || dm.carbs_g > 800) return false;
  if (!Number.isFinite(dm.fat_g) || dm.fat_g < 0 || dm.fat_g > 500) return false;
  if (!Number.isFinite(dm.fiber_g) || dm.fiber_g < 0 || dm.fiber_g > 200) return false;
  return true;
}

export function parseAiResponse(
  text: string,
  items: AiEstimateInputItem[],
  requestId: string,
): AiItemEstimate[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    console.error(JSON.stringify({ level: 'error', stage: 'GeminiItemEstimator', event: 'invalid_json', request_id: requestId }));
    return [];
  }

  const rawItems = (parsed as { items?: unknown } | null)?.items;
  if (!Array.isArray(rawItems)) {
    console.error(JSON.stringify({ level: 'error', stage: 'GeminiItemEstimator', event: 'invalid_shape', request_id: requestId }));
    return [];
  }

  const itemsByIndex = new Map(items.map((i) => [i.input_index, i]));
  const seen = new Set<number>();
  const out: AiItemEstimate[] = [];

  for (const raw of rawItems) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as Record<string, unknown>;
    const inputIndex = typeof r.input_index === 'number' ? r.input_index : null;
    if (inputIndex == null || seen.has(inputIndex) || !itemsByIndex.has(inputIndex)) continue;

    const candidateIds = new Set(itemsByIndex.get(inputIndex)!.candidates.map((c) => c.food_id));
    const dm = r.direct_macros && typeof r.direct_macros === 'object'
      ? {
          kcal: Number((r.direct_macros as Record<string, unknown>).kcal),
          protein_g: Number((r.direct_macros as Record<string, unknown>).protein_g),
          carbs_g: Number((r.direct_macros as Record<string, unknown>).carbs_g),
          fat_g: Number((r.direct_macros as Record<string, unknown>).fat_g),
          fiber_g: Number((r.direct_macros as Record<string, unknown>).fiber_g),
        }
      : undefined;

    const candidate: AiItemEstimate = {
      input_index: inputIndex,
      selected_food_id: typeof r.selected_food_id === 'number' ? r.selected_food_id : null,
      estimated_grams: typeof r.estimated_grams === 'number' ? r.estimated_grams : 0,
      food_label: typeof r.food_label === 'string' ? r.food_label : '',
      direct_macros: dm,
      note: typeof r.note === 'string' ? r.note : '',
    };

    if (!validateAiItem(candidate, candidateIds)) {
      console.warn(JSON.stringify({ level: 'warn', stage: 'GeminiItemEstimator', event: 'invalid_item', input_index: inputIndex, request_id: requestId }));
      continue;
    }

    out.push(candidate);
    seen.add(inputIndex);
  }

  return out;
}

// ---------------------------------------------------------------------------
// Gemini implementation
// ---------------------------------------------------------------------------

const GEMINI_MODEL = 'gemini-flash-latest';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const TIMEOUT_MS = 10_000;

export class GeminiItemEstimator implements AiItemEstimator {
  constructor(private readonly apiKey: string | undefined) {}

  provider(): string { return 'gemini'; }

  async estimate(items: AiEstimateInputItem[]): Promise<AiEstimateResult> {
    const requestId = crypto.randomUUID();

    if (items.length === 0) {
      return { results: [], provider: 'gemini', request_id: requestId };
    }
    if (!this.apiKey) {
      console.error(JSON.stringify({ level: 'error', stage: 'GeminiItemEstimator', event: 'missing_secret', request_id: requestId }));
      return { results: [], provider: 'gemini', request_id: requestId };
    }

    const prompt = buildBatchPrompt(items);

    let text = await this.callOnce(prompt, requestId);
    if (text === null) {
      // One retry on 429/503/timeout (callOnce returns null for all of these).
      text = await this.callOnce(prompt, `${requestId}:retry`);
    }
    if (text === null) {
      return { results: [], provider: 'gemini', request_id: requestId };
    }

    const results = parseAiResponse(text, items, requestId);
    return { results, provider: 'gemini', request_id: requestId };
  }

  private async callOnce(prompt: string, label: string): Promise<string | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const startedAt = Date.now();
    try {
      const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.apiKey! },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, responseMimeType: 'application/json', maxOutputTokens: 4096 },
        }),
        signal: controller.signal,
      });
      if (res.status === 429 || res.status === 503) {
        console.warn(JSON.stringify({ level: 'warn', stage: 'GeminiItemEstimator', event: 'retryable_status', status: res.status, request_id: label }));
        return null;
      }
      if (!res.ok) {
        console.error(JSON.stringify({ level: 'error', stage: 'GeminiItemEstimator', event: 'http_error', status: res.status, request_id: label }));
        return null;
      }
      const body = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
      const text = body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
      if (!text) {
        console.error(JSON.stringify({ level: 'error', stage: 'GeminiItemEstimator', event: 'empty_response', request_id: label }));
        return null;
      }
      console.log(JSON.stringify({
        level: 'info', stage: 'GeminiItemEstimator', event: 'response_received',
        status: res.status, latency_ms: Date.now() - startedAt, request_id: label,
      }));
      return text;
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === 'AbortError';
      console.error(JSON.stringify({
        level: 'error', stage: 'GeminiItemEstimator',
        event: aborted ? 'timeout' : 'request_failed', request_id: label,
      }));
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}