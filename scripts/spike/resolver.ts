import { FOODS, FoodRecord } from './data/foods';
import { ALIASES, AMBIGUOUS_TERMS } from './data/aliases';

export type MatchLayer = 'exact' | 'alias' | 'fuzzy' | 'ambiguous' | 'unknown';

export type ResolutionType = 'matched' | 'default_guess' | 'unknown';

export interface ParsedItem {
  raw_text: string;
  quantity: number;
  unit: string | null;
  food_name: string;
  range?: [number, number];
}

export interface ResolvedItem {
  raw_text: string;
  food_id: string | null;
  canonical_name: string;
  quantity: number;
  unit: string | null;
  grams: number;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  confidence: number;
  layer: MatchLayer;
  /** Populated when layer === 'ambiguous'. */
  candidates?: string[];

  /** True when the client MUST show a confirm/edit step for this item
   *  before the meal can be saved. Ambiguous and unknown items always set
   *  this. Fuzzy items below 0.55 confidence also set it. */
  requires_confirmation: boolean;

  /** 'matched'       — a real catalog entry produced the macros.
   *  'default_guess' — an ambiguous name was resolved to a default entry
   *                    so the user sees a number, but this is NOT final.
   *  'unknown'       — no food was resolved; escalation required. */
  resolution_type: ResolutionType;
}

export interface ResolverResult {
  items: ResolvedItem[];
  total_kcal: number;
  total_protein: number;
  total_fat: number;
  total_carbs: number;
  overall_confidence: number;
  /** Aggregate gate. True when ANY item has requires_confirmation = true.
   *  When true, the client MUST present a confirm/edit step. Never save
   *  directly to the user's log when this is true. */
  needs_confirmation: boolean;
  layers_used: MatchLayer[];
}

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  half: 0.5, a: 1, an: 1,
};

// Unit alternation MUST be longest-first. `g` before `glass` causes the
// regex engine to match the first character of `glass` and leave `lass`.
const UNIT_ALT = '(glass|tbsp|tsp|scoop|piece|slice|bowl|cup|ml|g)';

function normalize(input: string): string {
  let s = input.toLowerCase().trim();
  s = s.replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|half|a|an)\b/g,
    (w) => String(NUMBER_WORDS[w] ?? w));
  s = s.replace(/[,+&]/g, ' and ');
  s = s.replace(/\s+with\s+/g, ' and ');
  s = s.replace(/\s+and\s+and\s+/g, ' and ');
  s = s.replace(/(\d+(?:\.\d+)?)\s*(g|gm|gms|grams?)\b/g, '$1g');
  s = s.replace(/(\d+(?:\.\d+)?)\s*(ml|mls|milliliters?)\b/g, '$1ml');
  s = s.replace(/(\d+(?:\.\d+)?)\s*(pieces?|pcs?)\b/g, '$1 piece');
  s = s.replace(/(\d+(?:\.\d+)?)\s*(slices?)\b/g, '$1 slice');
  s = s.replace(/(\d+(?:\.\d+)?)\s*(bowls?|katoris?)\b/g, '$1 bowl');
  s = s.replace(/(\d+(?:\.\d+)?)\s*(cups?)\b/g, '$1 cup');
  s = s.replace(/(\d+(?:\.\d+)?)\s*(tbsp|tablespoons?)\b/g, '$1 tbsp');
  s = s.replace(/(\d+(?:\.\d+)?)\s*(tsp|teaspoons?)\b/g, '$1 tsp');
  s = s.replace(/(\d+(?:\.\d+)?)\s*(glasses?)\b/g, '$1 glass');
  s = s.replace(/(\d+)\s*x\s+(?=[a-z])/g, '$1 ');
  s = s.replace(/[^a-z0-9\s.\-]/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

function splitParts(normalized: string): ParsedItem[] {
  const raw = normalized.split(/\s+and\s+/).filter(Boolean);
  const items: ParsedItem[] = [];

  for (const part of raw) {
    const rangeMatch = part.match(
      new RegExp(`^(\\d+(?:\\.\\d+)?)\\s*-\\s*(\\d+(?:\\.\\d+)?)\\s*${UNIT_ALT}?\\s*(?:of\\s+)?(.+)$`),
    );
    if (rangeMatch) {
      const lo = Number(rangeMatch[1]);
      const hi = Number(rangeMatch[2]);
      items.push({
        raw_text: part.trim(),
        quantity: (lo + hi) / 2,
        unit: rangeMatch[3] ?? null,
        food_name: rangeMatch[4].trim(),
        range: [lo, hi],
      });
      continue;
    }
    const m = part.match(
      new RegExp(`^(?:(\\d+(?:\\.\\d+)?)\\s*${UNIT_ALT}?\\s*(?:of\\s+)?)?(.+)$`),
    );
    if (!m) continue;
    const qtyStr = m[1];
    const unit = m[2] ?? null;
    const food = m[3].trim();
    if (!food) continue;
    items.push({
      raw_text: part.trim(),
      quantity: qtyStr ? Number(qtyStr) : 1,
      unit,
      food_name: food,
    });
  }
  return items;
}

const UNIT_GRAMS: Record<string, number> = {
  tbsp: 14, tsp: 5, glass: 240, cup: 240, bowl: 150,
  piece: 1, slice: 1, scoop: 30,
};

function toGrams(food: FoodRecord, quantity: number, unit: string | null, aliasOverride?: number): number | null {
  if (aliasOverride != null) return quantity * aliasOverride;
  if (unit === 'g' || unit === 'ml') return quantity;
  if (unit == null) {
    if (!food.default_portion_grams) return null;
    return quantity * food.default_portion_grams;
  }
  if (food.default_portion_grams && food.default_portion_label) {
    const label = food.default_portion_label.toLowerCase();
    if (label.includes(unit)) return quantity * food.default_portion_grams;
  }
  const ug = UNIT_GRAMS[unit];
  return ug ? quantity * ug : null;
}

function bigrams(s: string): Set<string> {
  const out = new Set<string>();
  const t = ` ${s} `;
  for (let i = 0; i < t.length - 1; i++) out.add(t.slice(i, i + 2));
  return out;
}

function dice(a: string, b: string): number {
  const A = bigrams(a), B = bigrams(b);
  if (A.size === 0 && B.size === 0) return 1;
  let inter = 0;
  for (const g of A) if (B.has(g)) inter++;
  return (2 * inter) / (A.size + B.size);
}

function fuzzyFindFood(name: string): { food: FoodRecord; score: number } | null {
  let best: { food: FoodRecord; score: number } | null = null;
  for (const f of FOODS) {
    const s = Math.max(
      dice(name, f.canonical_name),
      dice(name, f.display_name.toLowerCase()),
      ...f.aliases.map((a) => dice(name, a)),
    );
    if (!best || s > best.score) best = { food: f, score: s };
  }
  return best && best.score >= 0.45 ? best : null;
}

export function resolve(rawText: string): ResolverResult {
  const normalized = normalize(rawText);
  const parts = splitParts(normalized);
  const items: ResolvedItem[] = [];

  for (const part of parts) {
    const name = part.food_name;
    const ambiguousList = AMBIGUOUS_TERMS[name];
    const isAmbiguousName = Array.isArray(ambiguousList) && ambiguousList.length > 1;

    // --- Step A: resolve the food_id and portion using alias → exact → fuzzy ---
    let food: FoodRecord | null = null;
    let layer: MatchLayer = 'unknown';
    let aliasOverride: number | undefined;

    // A1. compound alias (unit + name) — "katori dal" before "dal"
    if (part.unit) {
      const a = ALIASES.find((x) => x.alias === `${part.unit} ${name}`);
      if (a) {
        const f = FOODS.find((x) => x.id === a.food_id);
        if (f) {
          food = f;
          aliasOverride = a.portion_grams;
          layer = 'alias';
        }
      }
    }

    // A2. simple alias — "dal", "sabzi", "chapati"
    if (!food) {
      const a = ALIASES.find((x) => x.alias === name);
      if (a) {
        const f = FOODS.find((x) => x.id === a.food_id);
        if (f) {
          food = f;
          aliasOverride = a.portion_grams;
          layer = 'alias';
        }
      }
    }

    // A3. exact canonical / id match
    if (!food) {
      const f = FOODS.find((x) => x.canonical_name === name || x.id === name);
      if (f) {
        food = f;
        layer = 'exact';
      }
    }

    // A4. fuzzy
    if (!food) {
      const hit = fuzzyFindFood(name);
      if (hit) {
        food = hit.food;
        layer = 'fuzzy';
      }
    }

    // --- Step B: ambiguity overlay (does NOT replace the resolution) ---
    if (isAmbiguousName) {
      layer = 'ambiguous';
    }

    // --- Step C: unknown if we never resolved a food AND not ambiguous ---
    if (!food && !isAmbiguousName) {
      items.push({
        raw_text: part.raw_text,
        food_id: null,
        canonical_name: name,
        quantity: part.quantity,
        unit: part.unit,
        grams: 0,
        kcal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0,
        confidence: 0,
        layer: 'unknown',
        requires_confirmation: true,
        resolution_type: 'unknown',
      });
      continue;
    }

    // --- Step D: ambiguous but no food resolved → zero macros, low confidence ---
    if (!food && isAmbiguousName) {
      items.push({
        raw_text: part.raw_text,
        food_id: null,
        canonical_name: name,
        quantity: part.quantity,
        unit: part.unit,
        grams: 0,
        kcal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0,
        confidence: 0.3,
        layer: 'ambiguous',
        candidates: ambiguousList,
        requires_confirmation: true,
        resolution_type: 'default_guess',
      });
      continue;
    }

    // --- Step E: compute macros from the resolved food ---
    const grams = toGrams(food!, part.quantity, part.unit, aliasOverride);
    if (grams == null) {
      items.push({
        raw_text: part.raw_text,
        food_id: food!.id,
        canonical_name: food!.canonical_name,
        quantity: part.quantity,
        unit: part.unit,
        grams: 0,
        kcal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0,
        confidence: 0.3,
        layer: 'unknown',
        requires_confirmation: true,
        resolution_type: 'unknown',
      });
      continue;
    }

    const scale = grams / 100;
    const rangePenalty = part.range ? 0.9 : 1.0;
    const layerConf: Record<MatchLayer, number> = {
      exact: 0.95,
      alias: 0.90,
      fuzzy: 0.65,
      // Ambiguous gets a low score so it always surfaces for confirmation,
      // but we still compute the macros so the user sees a usable number.
      ambiguous: aliasOverride != null ? 0.50 : 0.40,
      unknown: 0,
    };
    const confidence = Math.round(layerConf[layer] * rangePenalty * 100) / 100;

    items.push({
      raw_text: part.raw_text,
      food_id: food!.id,
      canonical_name: food!.canonical_name,
      quantity: part.quantity,
      unit: part.unit,
      grams: Math.round(grams),
      kcal: Math.round(food!.per_100g.kcal * scale),
      protein: Math.round(food!.per_100g.protein * scale * 10) / 10,
      fat: Math.round(food!.per_100g.fat * scale * 10) / 10,
      carbs: Math.round(food!.per_100g.carbs * scale * 10) / 10,
      fiber: Math.round(food!.per_100g.fiber * scale * 10) / 10,
      confidence,
      layer,
      candidates: isAmbiguousName ? ambiguousList : undefined,
      requires_confirmation: isAmbiguousName || confidence < 0.55,
      resolution_type: isAmbiguousName ? 'default_guess' : 'matched',
    });
  }

  const total_kcal = items.reduce((s, i) => s + i.kcal, 0);
  const total_protein = Math.round(items.reduce((s, i) => s + i.protein, 0) * 10) / 10;
  const total_fat = Math.round(items.reduce((s, i) => s + i.fat, 0) * 10) / 10;
  const total_carbs = Math.round(items.reduce((s, i) => s + i.carbs, 0) * 10) / 10;
  const overall_confidence = items.length
    ? Math.round((items.reduce((s, i) => s + i.confidence, 0) / items.length) * 100) / 100
    : 0;

  // Confirmation is item-level: if ANY item requires confirmation, we ask.
  const needs_confirmation = items.some((i) => i.requires_confirmation);

  return {
    items,
    total_kcal,
    total_protein,
    total_fat,
    total_carbs,
    overall_confidence,
    needs_confirmation,
    layers_used: Array.from(new Set(items.map((i) => i.layer))),
  };
}

/**
 * Best-effort: given a free-form food string (e.g. from an LLM's
 * `foods_detected` array), return the canonical catalog id it best matches,
 * or null. Uses the same normalize → alias → exact → fuzzy pipeline as the
 * resolver, but returns only the id — used by the AI-baseline harness to
 * compare LLM food identification against ground truth.
 */
export function identifyCanonicalId(text: string): string | null {
  const name = normalize(text);
  if (!name) return null;

  // Alias on "name"
  const simpleAlias = ALIASES.find((a) => a.alias === name);
  if (simpleAlias) return simpleAlias.food_id;

  // Alias on stripped form: remove leading "N unit " and retry
  const stripped = name.replace(/^\d+(?:\.\d+)?\s*\w+\s+/, '').trim();
  if (stripped && stripped !== name) {
    const alias2 = ALIASES.find((a) => a.alias === stripped);
    if (alias2) return alias2.food_id;
    const exact2 = FOODS.find((f) => f.canonical_name === stripped || f.id === stripped);
    if (exact2) return exact2.id;
  }

  // Exact canonical / id
  const exact = FOODS.find((f) => f.canonical_name === name || f.id === name);
  if (exact) return exact.id;

  // Fuzzy
  const hit = fuzzyFindFood(name);
  return hit ? hit.food.id : null;
}

export { normalize as normalizeForTests };