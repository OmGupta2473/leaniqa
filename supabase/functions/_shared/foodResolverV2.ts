/**
 * Phase 6.7 R2.3 — Food resolver V2 (fork of foodResolver.ts).
 *
 * Same layers, same memory contract, same oil overlay. Adds:
 *
 *   1. Preparation-word stripping (R2.0) in splitIntoItems.
 *   2. Portion lookup through food_portions (R2.1) in buildResolvedItem,
 *      replacing the v5 inline default-only path. Fixes katori.
 *   3. Ambiguity signal for ALL layers (R2.2), not just fuzzy/exact.
 *      Memory hits and alias hits are re-checked, closing the a04 gap.
 *   4. was_ambiguous and kb_confidence on every item and on the response.
 *   5. Memory write policy: reject any meal where any item is ambiguous.
 *
 * The v5 foodResolver.ts is intentionally untouched. Resolve-meal (v5)
 * continues to run the old resolver on staging.
 *
 * New ResolverDb methods required (implemented in resolve-meal-v2):
 *   - getFoodPortions(foodId: number): Promise<FoodPortionRow[]>
 *   - getAllAmbiguousTerms(): Promise<string[]>
 */

import { stripPreparationWords } from './prepStrip.ts';
import {
  lookupPortion,
  type FoodPortionRow,
  type PortionSource,
} from './portionLookup.ts';
import {
  itemHasAmbiguitySignal,
  shouldBlockMemoryWrite,
  makeAmbiguousTermSet,
  type AmbiguityCheckItem,
} from './ambiguitySignal.ts';

// =============================================================================
// Types
// =============================================================================

export interface ClarificationCandidate {
  food_id: number;
  display_name: string;
  canonical_name: string;
  category: string | null;
  grams: number;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  rank: number;
  is_default: boolean;
}

export interface UserSelection {
  input_term: string;
  food_id: number;
}

export interface FoodRow {
  id: number;
  source: string;
  source_id: string;
  source_rank: number;
  canonical_name: string;
  display_name: string;
  search_name: string;
  category: string | null;
  kcal_per_100g: number;
  protein_per_100g: number;
  fat_per_100g: number;
  carbs_per_100g: number;
  fiber_per_100g: number;
  default_portion_grams: number | null;
  default_portion_label: string | null;
  is_ambiguous: boolean;
  oil_included: boolean;
  oil_per_100g: number | null;
  provenance: string | null;
  review_status: string;
}

export interface AliasRow {
  alias: string;
  food_id: number;
  portion_grams: number | null;
  portion_unit: string | null;
  confidence: number;
}

export interface ScoredFood {
  food: FoodRow;
  similarity: number;
}

export interface ScoredAlias {
  alias: AliasRow;
  similarity: number;
}

export interface AmbiguousCandidate {
  food_id: number;
  rank: number;
}

export interface MealMemoryRow {
  user_id: string;
  normalized_text: string;
  items: ResolvedItem[];
  total_kcal: number;
  total_protein: number;
  total_fat: number;
  total_carbs: number;
  uses: number;
  last_used_at: string;
}

export interface PopularMealRow {
  normalized_text: string;
  items: ResolvedItem[];
  total_kcal: number;
  total_protein: number;
  total_fat: number;
  total_carbs: number;
  distinct_users: number;
  total_uses: number;
}

export interface MemoryWrite {
  items: ResolvedItem[];
  total_kcal: number;
  total_protein: number;
  total_fat: number;
  total_carbs: number;
}

export type MatchLayer =
  | 'memory'
  | 'popular'
  | 'exact'
  | 'alias'
  | 'local_search'
  | 'user_selection'
  | 'ambiguous';

export type ResolutionType = 'matched' | 'default_guess' | 'unknown';

export interface ResolvedItem {
  raw_text: string;
  input_term: string;
  food_id: number | null;
  canonical_name: string;
  category: string | null;
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
  resolution_type: ResolutionType;
  requires_confirmation: boolean;
  candidates?: ClarificationCandidate[];
  oil_included: boolean;
  oil_review_needed: boolean;
  /** Phase 6.7 — true when this item was flagged ambiguous by any signal
   *  (layer, candidates, or input_term in food_ambiguous_terms). */
  was_ambiguous: boolean;
  /** Phase 6.7 — confidence in (food × portion). Distinct from
   *  `confidence` which is only about food match. */
  kb_confidence: number;
}

export interface UnresolvedItem {
  raw_text: string;
  input_term: string;
  quantity: number;
  unit: string | null;
  range?: [number, number];
}

export interface ParsedItem {
  raw_text: string;
  quantity: number;
  unit: string | null;
  food_name: string;
  range?: [number, number];
}

export interface ResolverInput {
  userId: string;
  rawText: string;
  normalizedText?: string;
  mealType: string;
  seededItems?: ParsedItem[];
  selections?: UserSelection[];
}

export interface ResolverResult {
  items: ResolvedItem[];
  unresolved_items: UnresolvedItem[];
  totals: {
    kcal: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
  };
  meal_confidence: number;
  needs_confirmation: boolean;
  layers_used: MatchLayer[];
  metadata: {
    resolution_ms: number;
    memory_hit: boolean;
    popular_hit: boolean;
  };
  /** Phase 6.7 — true if ANY item was ambiguous (regardless of layer). */
  was_ambiguous: boolean;
  /** Phase 6.7 — min(kb_confidence) across items. 0 for empty meals. */
  kb_confidence: number;
  /** Phase 6.7 — always false in v2; AI fallback is disabled this phase. */
  ai_used: false;
}

export interface ResolverConfig {
  confidenceThreshold: number;
  memoryReadEnabled: boolean;
  memoryWriteEnabled: boolean;
  memoryWriteThreshold: number;
  fuzzySearchMinSimilarity: number;
  fuzzySearchLimit: number;
  maxItemsPerMeal: number;
  maxCandidatesPerItem: number;
}

export const DEFAULT_RESOLVER_CONFIG: ResolverConfig = {
  confidenceThreshold: 0.55,
  memoryReadEnabled: true,
  memoryWriteEnabled: true,
  memoryWriteThreshold: 0.75,
  fuzzySearchMinSimilarity: 0.4,
  fuzzySearchLimit: 5,
  maxItemsPerMeal: 20,
  maxCandidatesPerItem: 5,
};

export interface ResolverDb {
  getFoodByCanonicalName(canonicalName: string): Promise<FoodRow | null>;
  getFoodsByIds(ids: number[]): Promise<FoodRow[]>;
  getAliasByKey(alias: string): Promise<AliasRow | null>;
  fuzzySearchAliases(term: string, limit: number, minSimilarity: number): Promise<ScoredAlias[]>;
  fuzzySearchFoods(term: string, limit: number, minSimilarity: number): Promise<ScoredFood[]>;
  getAmbiguousCandidates(term: string): Promise<AmbiguousCandidate[]>;
  getMemoryEntry(userId: string, normalizedText: string): Promise<MealMemoryRow | null>;
  upsertMemoryEntry(userId: string, normalizedText: string, entry: MemoryWrite): Promise<void>;
  getPopularMeal(normalizedText: string): Promise<PopularMealRow | null>;
  /** Phase 6.7 — NEW. Returns rows from the food_portions table. */
  getFoodPortions(foodId: number): Promise<FoodPortionRow[]>;
  /** Phase 6.7 — NEW. Returns all terms from food_ambiguous_terms. */
  getAllAmbiguousTerms(): Promise<string[]>;
}

// =============================================================================
// Normalization + parsing
// =============================================================================

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  half: 0.5, a: 1, an: 1,
};

const UNIT_ALT = '(glass|tbsp|tsp|scoop|piece|slice|bowl|katori|cup|ml|g)\\b';

export function normalizeInput(input: string): string {
  let s = input.toLowerCase().trim();
  s = s.replace(
    /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|half|a|an)\b/g,
    (w) => String(NUMBER_WORDS[w] ?? w),
  );
  s = s.replace(/[,+&]/g, ' and ');
  s = s.replace(/\s+with\s+/g, ' and ');
  s = s.replace(/\s+and\s+and\s+/g, ' and ');
  s = s.replace(/(\d+(?:\.\d+)?)\s*(g|gm|gms|grams?)\b/g, '$1g');
  s = s.replace(/(\d+(?:\.\d+)?)\s*(ml|mls|milliliters?)\b/g, '$1ml');
  s = s.replace(/(\d+(?:\.\d+)?)\s*(pieces?|pcs?)\b/g, '$1 piece');
  s = s.replace(/(\d+(?:\.\d+)?)\s*(slices?)\b/g, '$1 slice');
  s = s.replace(/(\d+(?:\.\d+)?)\s*(bowls?)\b/g, '$1 bowl');
  s = s.replace(/(\d+(?:\.\d+)?)\s*(katoris?)\b/g, '$1 katori');
  s = s.replace(/(\d+(?:\.\d+)?)\s*(cups?)\b/g, '$1 cup');
  s = s.replace(/(\d+(?:\.\d+)?)\s*(tbsp|tablespoons?)\b/g, '$1 tbsp');
  s = s.replace(/(\d+(?:\.\d+)?)\s*(tsp|teaspoons?)\b/g, '$1 tsp');
  s = s.replace(/(\d+(?:\.\d+)?)\s*(glasses?)\b/g, '$1 glass');
  s = s.replace(/(\d+)\s*x\s+(?=[a-z])/g, '$1 ');
  s = s.replace(/[^a-z0-9\s.\-]/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

function splitIntoItems(normalized: string): ParsedItem[] {
  const parts = normalized.split(/\s+and\s+/).filter(Boolean);
  const items: ParsedItem[] = [];

  for (const part of parts) {
    const rangeMatch = part.match(
      new RegExp(
        `^(\\d+(?:\\.\\d+)?)\\s*-\\s*(\\d+(?:\\.\\d+)?)\\s*(?:${UNIT_ALT})?\\s*(?:of\\s+)?(.+)$`,
      ),
    );
    if (rangeMatch) {
      const lo = Number(rangeMatch[1]);
      const hi = Number(rangeMatch[2]);
      const foodRaw = rangeMatch[4].trim();
      const foodStripped = stripPreparationWords(foodRaw);
      items.push({
        raw_text: part.trim(),
        quantity: (lo + hi) / 2,
        unit: rangeMatch[3] ?? null,
        food_name: foodStripped.length > 0 ? foodStripped : foodRaw,
        range: [lo, hi],
      });
      continue;
    }

    const m = part.match(
      new RegExp(
        `^(?:(\\d+(?:\\.\\d+)?)\\s*(?:${UNIT_ALT})?\\s*(?:of\\s+)?)?(.+)$`,
      ),
    );
    if (!m) continue;
    const qtyStr = m[1];
    const unit = m[2] ?? null;
    const foodRaw = m[3].trim();
    if (!foodRaw) continue;
    const foodStripped = stripPreparationWords(foodRaw);
    items.push({
      raw_text: part.trim(),
      quantity: qtyStr ? Number(qtyStr) : 1,
      unit,
      food_name: foodStripped.length > 0 ? foodStripped : foodRaw,
    });
  }

  return items;
}

// =============================================================================
// Grams resolution (R2.1 portion lookup, with alias-portion fallback)
// =============================================================================

interface GramsResolution {
  grams: number;
  source: PortionSource;
}

async function resolveToGrams(
  db: ResolverDb,
  quantity: number,
  unit: string | null,
  food: FoodRow,
  aliasPortion: { grams: number | null; unit: string | null } | null,
): Promise<GramsResolution | null> {
  // 1. Structured portion lookup (food_portions first, legacy fallback inside).
  const portResult = await lookupPortion(
    db,
    {
      id: food.id,
      default_portion_grams: food.default_portion_grams,
      default_portion_label: food.default_portion_label,
    },
    unit,
  );
  if (portResult !== null) {
    return {
      grams: quantity * portResult.grams,
      source: portResult.source,
    };
  }

  // 2. Alias portion fallback — only when the alias's unit matches the
  // requested unit, or when no unit was requested.
  if (aliasPortion?.grams != null) {
    if (aliasPortion.unit === unit || unit === null) {
      return {
        grams: quantity * aliasPortion.grams,
        source: 'legacy_default',
      };
    }
  }

  return null;
}

// =============================================================================
// Matching layers
// =============================================================================

async function tryExact(foodName: string, db: ResolverDb): Promise<{ food: FoodRow } | null> {
  const food = await db.getFoodByCanonicalName(foodName);
  return food ? { food } : null;
}

async function tryAlias(
  foodName: string,
  unit: string | null,
  db: ResolverDb,
): Promise<{
  food: FoodRow;
  aliasPortion: { grams: number | null; unit: string | null };
} | null> {
  const keys: string[] = [];
  if (unit) keys.push(`${unit} ${foodName}`);
  keys.push(foodName);

  for (const key of keys) {
    const alias = await db.getAliasByKey(key);
    if (!alias) continue;
    const foods = await db.getFoodsByIds([alias.food_id]);
    const food = foods[0];
    if (!food) continue;
    return {
      food,
      aliasPortion: { grams: alias.portion_grams, unit: alias.portion_unit },
    };
  }
  return null;
}

async function tryLocalSearch(
  foodName: string,
  db: ResolverDb,
  minSimilarity: number,
  limit: number,
): Promise<{ food: FoodRow; similarity: number } | null> {
  const aliasHits = await db.fuzzySearchAliases(foodName, limit, minSimilarity);
  if (aliasHits.length > 0) {
    const best = aliasHits[0];
    const foods = await db.getFoodsByIds([best.alias.food_id]);
    if (foods[0]) {
      return { food: foods[0], similarity: best.similarity };
    }
  }
  const foodHits = await db.fuzzySearchFoods(foodName, limit, minSimilarity);
  if (foodHits.length > 0) {
    return { food: foodHits[0].food, similarity: foodHits[0].similarity };
  }
  return null;
}

// =============================================================================
// Item construction
// =============================================================================

function portionFactor(source: PortionSource): number {
  switch (source) {
    case 'passthrough':
    case 'exact_unit':
      return 1.0;
    case 'default':
      return 0.95;
    case 'legacy_default':
      return 0.85;
    default:
      return 0.5;
  }
}

async function buildResolvedItem(
  parsed: ParsedItem,
  food: FoodRow,
  aliasPortion: { grams: number | null; unit: string | null } | null,
  layer: MatchLayer,
  baseConfidence: number,
  config: ResolverConfig,
  db: ResolverDb,
): Promise<ResolvedItem | null> {
  const resolution = await resolveToGrams(
    db,
    parsed.quantity,
    parsed.unit,
    food,
    aliasPortion,
  );
  if (resolution === null || resolution.grams <= 0) return null;

  const grams = resolution.grams;
  const rangePenalty = parsed.range ? 0.9 : 1.0;
  const confidence = Math.round(baseConfidence * rangePenalty * 100) / 100;
  const requiresConfirmation = confidence < config.confidenceThreshold;
  const kbConfidence = Math.round(confidence * portionFactor(resolution.source) * 100) / 100;
  const scale = grams / 100;

  return {
    raw_text: parsed.raw_text,
    input_term: parsed.food_name,
    food_id: food.id,
    canonical_name: food.canonical_name,
    category: food.category,
    quantity: parsed.quantity,
    unit: parsed.unit,
    grams: Math.round(grams),
    kcal: Math.round(food.kcal_per_100g * scale),
    protein: Math.round(food.protein_per_100g * scale * 10) / 10,
    fat: Math.round(food.fat_per_100g * scale * 10) / 10,
    carbs: Math.round(food.carbs_per_100g * scale * 10) / 10,
    fiber: Math.round(food.fiber_per_100g * scale * 10) / 10,
    confidence,
    layer,
    resolution_type: 'matched',
    requires_confirmation: requiresConfirmation,
    oil_included: food.oil_included,
    oil_review_needed: false,
    was_ambiguous: false,
    kb_confidence: kbConfidence,
  };
}

async function resolveOneItem(
  parsed: ParsedItem,
  db: ResolverDb,
  config: ResolverConfig,
): Promise<ResolvedItem | null> {
  const exact = await tryExact(parsed.food_name, db);
  if (exact) {
    return buildResolvedItem(parsed, exact.food, null, 'exact', 0.95, config, db);
  }

  const alias = await tryAlias(parsed.food_name, parsed.unit, db);
  if (alias) {
    const conf = alias.aliasPortion.grams != null ? 0.9 : 0.8;
    return buildResolvedItem(
      parsed, alias.food, alias.aliasPortion, 'alias', conf, config, db,
    );
  }

  const fuzzy = await tryLocalSearch(
    parsed.food_name, db, config.fuzzySearchMinSimilarity, config.fuzzySearchLimit,
  );
  if (fuzzy) {
    const conf = fuzzy.similarity >= 0.6 ? 0.75 : 0.5;
    return buildResolvedItem(parsed, fuzzy.food, null, 'local_search', conf, config, db);
  }

  return null;
}

// =============================================================================
// Clarification candidates
// =============================================================================

function buildClarificationCandidate(
  food: FoodRow,
  grams: number,
  rank: number,
  isDefault: boolean,
): ClarificationCandidate {
  const scale = grams / 100;
  return {
    food_id: food.id,
    display_name: food.display_name,
    canonical_name: food.canonical_name,
    category: food.category,
    grams,
    kcal: Math.round(food.kcal_per_100g * scale),
    protein: Math.round(food.protein_per_100g * scale * 10) / 10,
    fat: Math.round(food.fat_per_100g * scale * 10) / 10,
    carbs: Math.round(food.carbs_per_100g * scale * 10) / 10,
    fiber: Math.round(food.fiber_per_100g * scale * 10) / 10,
    rank,
    is_default: isDefault,
  };
}

// =============================================================================
// Ambiguity overlay (Phase 6.7 broadened)
// =============================================================================

async function applyAmbiguityOverlay(
  items: ResolvedItem[],
  db: ResolverDb,
  config: ResolverConfig,
  ambiguousTerms: ReadonlySet<string>,
): Promise<ResolvedItem[]> {
  const out: ResolvedItem[] = [];

  for (const item of items) {
    // Post-selection: the user already made a choice for this meal.
    // Don't re-prompt for the same item in the same request.
    if (item.layer === 'user_selection') {
      out.push({ ...item, was_ambiguous: false });
      continue;
    }

    const checkItem: AmbiguityCheckItem = {
      input_term: item.input_term,
      layer: item.layer,
      candidates: item.candidates ?? null,
    };

    if (!itemHasAmbiguitySignal(checkItem, ambiguousTerms)) {
      out.push({ ...item, was_ambiguous: false });
      continue;
    }

    const candidates = await db.getAmbiguousCandidates(item.input_term);
    if (candidates.length < 2) {
      // Term is in the ambiguity table but candidates row data is
      // inconsistent. Still flag for review rather than silently save.
      out.push({
        ...item,
        was_ambiguous: true,
        requires_confirmation: true,
      });
      continue;
    }

    const curatedIds = candidates.map((c) => c.food_id);
    const extraIds: number[] = [];
    if (item.food_id != null && !curatedIds.includes(item.food_id)) {
      extraIds.push(item.food_id);
    }
    const allIds = [...curatedIds, ...extraIds];
    const foods = await db.getFoodsByIds(allIds);
    const byId = new Map(foods.map((f) => [f.id, f]));

    const ordered: ClarificationCandidate[] = [];
    const included = new Set<number>();

    if (item.food_id != null) {
      const ownFood = byId.get(item.food_id);
      if (ownFood) {
        ordered.push(buildClarificationCandidate(ownFood, item.grams, 0, true));
        included.add(ownFood.id);
      }
    }
    for (const c of candidates) {
      if (included.has(c.food_id)) continue;
      const food = byId.get(c.food_id);
      if (!food) continue;
      const isDefault = ordered.length === 0;
      ordered.push(buildClarificationCandidate(food, item.grams, ordered.length, isDefault));
      included.add(food.id);
    }
    const capped = ordered
      .slice(0, config.maxCandidatesPerItem)
      .map((c, i) => ({ ...c, rank: i }));

    out.push({
      ...item,
      layer: 'ambiguous',
      resolution_type: 'default_guess',
      requires_confirmation: true,
      confidence: Math.min(item.confidence, 0.5),
      kb_confidence: Math.min(item.kb_confidence, 0.5),
      was_ambiguous: true,
      candidates: capped,
    });
  }

  return out;
}

function applyOilOverlay(items: ResolvedItem[]): ResolvedItem[] {
  const hasOilItem = items.some((i) => i.category === 'oil');
  if (!hasOilItem) return items;
  return items.map((item) => {
    if (item.category === 'oil') return item;
    if (item.oil_included) {
      return { ...item, oil_review_needed: true };
    }
    return item;
  });
}

// =============================================================================
// User selections
// =============================================================================

async function applySelections(
  items: ResolvedItem[],
  selections: UserSelection[],
  db: ResolverDb,
): Promise<ResolvedItem[]> {
  if (selections.length === 0) return items;

  const selectionByTerm = new Map<string, UserSelection>();
  for (const s of selections) selectionByTerm.set(s.input_term, s);

  const wantedIds = Array.from(new Set(selections.map((s) => s.food_id)));
  const foods = await db.getFoodsByIds(wantedIds);
  const byId = new Map(foods.map((f) => [f.id, f]));

  const out: ResolvedItem[] = [];
  for (const item of items) {
    const selection = selectionByTerm.get(item.input_term);
    if (!selection) { out.push(item); continue; }
    const food = byId.get(selection.food_id);
    if (!food) { out.push(item); continue; }
    const scale = item.grams / 100;
    out.push({
      raw_text: item.raw_text,
      input_term: item.input_term,
      food_id: food.id,
      canonical_name: food.canonical_name,
      category: food.category,
      quantity: item.quantity,
      unit: item.unit,
      grams: item.grams,
      kcal: Math.round(food.kcal_per_100g * scale),
      protein: Math.round(food.protein_per_100g * scale * 10) / 10,
      fat: Math.round(food.fat_per_100g * scale * 10) / 10,
      carbs: Math.round(food.carbs_per_100g * scale * 10) / 10,
      fiber: Math.round(food.fiber_per_100g * scale * 10) / 10,
      confidence: 1.0,
      layer: 'user_selection',
      resolution_type: 'matched',
      requires_confirmation: false,
      candidates: undefined,
      oil_included: food.oil_included,
      oil_review_needed: false,
      was_ambiguous: false,
      kb_confidence: 1.0,
    });
  }
  return out;
}

// =============================================================================
// Memory / popular (renamed layer to distinguish from post-selection)
// =============================================================================

async function revalidateItems(
  cachedItems: ResolvedItem[],
  db: ResolverDb,
): Promise<ResolvedItem[] | null> {
  const ids = cachedItems
    .map((i) => i.food_id)
    .filter((id): id is number => id != null);
  if (ids.length === 0) return null;

  const liveFoods = await db.getFoodsByIds(ids);
  const byId = new Map(liveFoods.map((f) => [f.id, f]));

  for (const item of cachedItems) {
    if (item.food_id == null) return null;
    const live = byId.get(item.food_id);
    if (!live) return null;
    if (!macrosMatch(item, live)) return null;
  }

  return cachedItems.map((item) => {
    const live = item.food_id != null ? byId.get(item.food_id) : null;
    if (!live || item.grams <= 0) {
      return {
        ...item,
        // Defensive defaults for legacy cache rows that predate 6.7.
        was_ambiguous: item.was_ambiguous ?? false,
        kb_confidence: item.kb_confidence ?? item.confidence,
      };
    }
    const scale = item.grams / 100;
    return {
      ...item,
      kcal: Math.round(live.kcal_per_100g * scale),
      protein: Math.round(live.protein_per_100g * scale * 10) / 10,
      fat: Math.round(live.fat_per_100g * scale * 10) / 10,
      carbs: Math.round(live.carbs_per_100g * scale * 10) / 10,
      fiber: Math.round(live.fiber_per_100g * scale * 10) / 10,
      was_ambiguous: item.was_ambiguous ?? false,
      kb_confidence: item.kb_confidence ?? item.confidence,
    };
  });
}

function macrosMatch(cached: ResolvedItem, live: FoodRow): boolean {
  if (cached.grams <= 0) return false;
  const scale = cached.grams / 100;
  const expKcal = Math.round(live.kcal_per_100g * scale);
  const expP = Math.round(live.protein_per_100g * scale * 10) / 10;
  const expF = Math.round(live.fat_per_100g * scale * 10) / 10;
  const expC = Math.round(live.carbs_per_100g * scale * 10) / 10;
  const expFi = Math.round(live.fiber_per_100g * scale * 10) / 10;
  return (
    Math.abs(cached.kcal - expKcal) <= 1 &&
    Math.abs(cached.protein - expP) <= 0.2 &&
    Math.abs(cached.fat - expF) <= 0.2 &&
    Math.abs(cached.carbs - expC) <= 0.2 &&
    Math.abs(cached.fiber - expFi) <= 0.2
  );
}

async function tryMemory(
  userId: string,
  normalizedText: string,
  db: ResolverDb,
): Promise<ResolvedItem[] | null> {
  const entry = await db.getMemoryEntry(userId, normalizedText);
  if (!entry) return null;
  const revalidated = await revalidateItems(entry.items, db);
  if (!revalidated) return null;
  // Rewrite layer to 'memory' so the ambiguity overlay re-checks these
  // items (Phase 6.7 — closes a04 gap).
  return revalidated.map((item) => ({
    ...item,
    layer: 'memory' as MatchLayer,
  }));
}

async function tryPopular(
  normalizedText: string,
  db: ResolverDb,
): Promise<ResolvedItem[] | null> {
  const entry = await db.getPopularMeal(normalizedText);
  if (!entry) return null;
  const revalidated = await revalidateItems(entry.items, db);
  if (!revalidated) return null;
  return revalidated.map((item) => ({
    ...item,
    layer: 'popular' as MatchLayer,
  }));
}

// =============================================================================
// Aggregation
// =============================================================================

function aggregate(items: ResolvedItem[]) {
  let kcal = 0, protein = 0, fat = 0, carbs = 0, fiber = 0;
  for (const i of items) {
    kcal += i.kcal;
    protein += i.protein;
    fat += i.fat;
    carbs += i.carbs;
    fiber += i.fiber;
  }
  return {
    kcal: Math.round(kcal),
    protein: Math.round(protein * 10) / 10,
    fat: Math.round(fat * 10) / 10,
    carbs: Math.round(carbs * 10) / 10,
    fiber: Math.round(fiber * 10) / 10,
  };
}

// =============================================================================
// Item pipeline
// =============================================================================

async function resolveItems(
  parsed: ParsedItem[],
  db: ResolverDb,
  config: ResolverConfig,
  layersUsed: Set<MatchLayer>,
  ambiguousTerms: ReadonlySet<string>,
  selections: UserSelection[] = [],
): Promise<{ items: ResolvedItem[]; unresolved: UnresolvedItem[] }> {
  const items: ResolvedItem[] = [];
  const unresolved: UnresolvedItem[] = [];

  for (const p of parsed) {
    const resolved = await resolveOneItem(p, db, config);
    if (resolved) {
      items.push(resolved);
      layersUsed.add(resolved.layer);
    } else {
      unresolved.push({
        raw_text: p.raw_text,
        input_term: p.food_name,
        quantity: p.quantity,
        unit: p.unit,
        range: p.range,
      });
    }
  }

  let currentItems = items;
  if (selections.length > 0) {
    currentItems = await applySelections(currentItems, selections, db);
    if (currentItems.some((i) => i.layer === 'user_selection')) {
      layersUsed.add('user_selection');
    }
  }

  const overlaid = await applyAmbiguityOverlay(currentItems, db, config, ambiguousTerms);
  if (overlaid.some((i) => i.layer === 'ambiguous')) layersUsed.add('ambiguous');

  const oiled = applyOilOverlay(overlaid);
  return { items: oiled, unresolved };
}

// =============================================================================
// Memory write eligibility
// =============================================================================

function isMemoryEligible(
  items: ResolvedItem[],
  unresolved: UnresolvedItem[],
  config: ResolverConfig,
  fromMemory: boolean,
  ambiguousTerms: ReadonlySet<string>,
): boolean {
  if (!config.memoryWriteEnabled) return false;
  if (fromMemory) return false;
  if (unresolved.length > 0) return false;
  if (items.length === 0) return false;

  for (const item of items) {
    if (item.requires_confirmation) return false;
    if (item.resolution_type !== 'matched') return false;
    if (item.confidence < config.memoryWriteThreshold) return false;
    if (item.oil_review_needed) return false;
    // Phase 6.7 — reject any ambiguous-originated item.
    if (
      shouldBlockMemoryWrite(
        { input_term: item.input_term, layer: item.layer, candidates: item.candidates ?? null },
        ambiguousTerms,
      )
    ) {
      return false;
    }
  }
  return true;
}

// =============================================================================
// Main entry point
// =============================================================================

export async function resolve(
  input: ResolverInput,
  db: ResolverDb,
  config: ResolverConfig = DEFAULT_RESOLVER_CONFIG,
): Promise<ResolverResult> {
  const startMs = Date.now();
  const layersUsed = new Set<MatchLayer>();

  const normalizedText = input.normalizedText ?? normalizeInput(input.rawText);

  // Fetch ambiguous terms once per request.
  const rawTerms = await db.getAllAmbiguousTerms();
  const ambiguousTerms = makeAmbiguousTermSet(rawTerms);

  // ---- Seeded path ------------------------------------------------------
  if (input.seededItems && input.seededItems.length > 0) {
    const seeded = input.seededItems.slice(0, config.maxItemsPerMeal);
    const { items, unresolved } = await resolveItems(
      seeded, db, config, layersUsed, ambiguousTerms,
    );
    return finalize({
      items, unresolved, layersUsed, startMs, config, db,
      userId: input.userId, normalizedText, fromMemory: false, ambiguousTerms,
    });
  }

  // ---- Layer 1: memory --------------------------------------------------
  if (config.memoryReadEnabled) {
    const memoryHit = await tryMemory(input.userId, normalizedText, db);
    if (memoryHit) {
      layersUsed.add('memory');
      const overlaid = await applyAmbiguityOverlay(memoryHit, db, config, ambiguousTerms);
      if (overlaid.some((i) => i.layer === 'ambiguous')) layersUsed.add('ambiguous');
      const oiled = applyOilOverlay(overlaid);
      return finalize({
        items: oiled, unresolved: [], layersUsed, startMs, config, db,
        userId: input.userId, normalizedText, fromMemory: true, ambiguousTerms,
      });
    }
  }

  // ---- Layer 2: popular cache -------------------------------------------
  const popularHit = await tryPopular(normalizedText, db);
  if (popularHit) {
    layersUsed.add('popular');
    const overlaid = await applyAmbiguityOverlay(popularHit, db, config, ambiguousTerms);
    if (overlaid.some((i) => i.layer === 'ambiguous')) layersUsed.add('ambiguous');
    const oiled = applyOilOverlay(overlaid);
    return finalize({
      items: oiled, unresolved: [], layersUsed, startMs, config, db,
      userId: input.userId, normalizedText, fromMemory: false, ambiguousTerms,
    });
  }

  // ---- Layers 3–5: per-item resolution ----------------------------------
  const parsed = splitIntoItems(normalizedText).slice(0, config.maxItemsPerMeal);
  const { items, unresolved } = await resolveItems(
    parsed, db, config, layersUsed, ambiguousTerms, input.selections ?? [],
  );

  return finalize({
    items, unresolved, layersUsed, startMs, config, db,
    userId: input.userId, normalizedText, fromMemory: false, ambiguousTerms,
  });
}

// =============================================================================
// Finalize
// =============================================================================

interface FinalizeInput {
  items: ResolvedItem[];
  unresolved: UnresolvedItem[];
  layersUsed: Set<MatchLayer>;
  startMs: number;
  config: ResolverConfig;
  db: ResolverDb;
  userId: string;
  normalizedText: string;
  fromMemory: boolean;
  ambiguousTerms: ReadonlySet<string>;
}

async function finalize(input: FinalizeInput): Promise<ResolverResult> {
  const totals = aggregate(input.items);

  const meal_confidence =
    input.items.length > 0
      ? Math.min(...input.items.map((i) => i.confidence))
      : 0;

  const meal_kb_confidence =
    input.items.length > 0
      ? Math.min(...input.items.map((i) => i.kb_confidence))
      : 0;

  const needs_confirmation = input.items.some((i) => i.requires_confirmation);
  const was_ambiguous = input.items.some((i) => i.was_ambiguous === true);

  if (
    isMemoryEligible(
      input.items,
      input.unresolved,
      input.config,
      input.fromMemory,
      input.ambiguousTerms,
    )
  ) {
    try {
      await input.db.upsertMemoryEntry(input.userId, input.normalizedText, {
        items: input.items,
        total_kcal: totals.kcal,
        total_protein: totals.protein,
        total_fat: totals.fat,
        total_carbs: totals.carbs,
      });
    } catch (err) {
      console.error(
        '[foodResolverV2] memory write failed:',
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  return {
    items: input.items,
    unresolved_items: input.unresolved,
    totals,
    meal_confidence,
    needs_confirmation,
    layers_used: Array.from(input.layersUsed),
    metadata: {
      resolution_ms: Date.now() - input.startMs,
      memory_hit: input.layersUsed.has('memory'),
      popular_hit: input.layersUsed.has('popular'),
    },
    was_ambiguous,
    kb_confidence: meal_kb_confidence,
    ai_used: false,
  };
}