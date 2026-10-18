/**
 * Phase 6.7 R2.1 — portion lookup module.
 *
 * Resolves "how many grams is one unit of this food" using the
 * food_portions table (populated by R1/R1.1 migrations) with a
 * backward-compatible fallback to the legacy foods.default_portion_*
 * columns.
 *
 * Priority:
 *   1. unit = 'g' | 'ml'          → passthrough (1 gram per unit)
 *   2. food_portions exact unit   → use row.grams
 *   3. food_portions is_default   → use row.grams (only when unit is null)
 *   4. foods.default_portion_*    → legacy fallback with label match
 *   5. null                       → item needs AI or manual entry
 *
 * The caller is responsible for multiplying the returned per-unit grams
 * by the item's quantity. This module never sees quantity.
 *
 * No imports, no DB writes, no network. Testable with a one-method
 * fake implementing PortionLookupDb.
 */

export interface FoodPortionRow {
  unit: string;
  grams: number;
  is_default: boolean;
  confidence: number;
}

export interface PortionLookupDb {
  getFoodPortions(foodId: number): Promise<FoodPortionRow[]>;
}

export interface PortionLookupFood {
  id: number;
  default_portion_grams: number | null;
  default_portion_label: string | null;
}

export type PortionSource =
  | 'passthrough'
  | 'exact_unit'
  | 'default'
  | 'legacy_default';

export interface PortionResult {
  /** Grams per ONE unit. Caller multiplies by quantity. */
  grams: number;
  /** Where the value came from — used for kb_confidence scoring. */
  source: PortionSource;
}
// Fixed: typo correction — should be PortionSource not PorotionSource
export interface PortionResult {
  grams: number;
  source: PortionSource;
}

export async function lookupPortion(
  db: PortionLookupDb,
  food: PortionLookupFood,
  unit: string | null,
): Promise<PortionResult | null> {
  // 1. Gram/ml passthrough — no portion row needed.
  if (unit === 'g' || unit === 'ml') {
    return { grams: 1, source: 'passthrough' };
  }

  // 2. Query food_portions once; reused for both exact-unit and
  //    is_default paths.
  const rows = await db.getFoodPortions(food.id);

  // 2a. Exact unit match (highest priority when unit is known).
  if (unit !== null) {
    const exact = rows.find((r) => r.unit === unit);
    if (exact && exact.grams > 0) {
      return { grams: exact.grams, source: 'exact_unit' };
    }
  }

  // 2b. Default portion row (only when unit is null).
  if (unit === null) {
    const def = rows.find((r) => r.is_default && r.grams > 0);
    if (def) {
      return { grams: def.grams, source: 'default' };
    }
  }

  // 3. Legacy fallback — foods.default_portion_grams.
  if (food.default_portion_grams !== null && food.default_portion_grams > 0) {
    if (unit === null) {
      return { grams: food.default_portion_grams, source: 'legacy_default' };
    }
    const label = (food.default_portion_label ?? '').toLowerCase();
    if (label.includes(unit.toLowerCase())) {
      return { grams: food.default_portion_grams, source: 'legacy_default' };
    }
  }

  // 4. No reliable portion.
  return null;
}

/**
 * True when this food has at least one reliable portion source:
 * either a food_portions row exists, OR legacy default_portion_grams
 * plus default_portion_label are set.
 *
 * Used by the ambiguity signal and kb_confidence scoring.
 */
export async function hasReliablePortion(
  db: PortionLookupDb,
  food: PortionLookupFood,
): Promise<boolean> {
  const rows = await db.getFoodPortions(food.id);
  if (rows.length > 0) return true;
  return (
    food.default_portion_grams !== null &&
    food.default_portion_label !== null
  );
}

/**
 * Return all portion rows for a food. Useful for AI prompt hint
 * construction (R2.4+) and for diagnostics.
 */
export async function getPortionsForFood(
  db: PortionLookupDb,
  foodId: number,
): Promise<FoodPortionRow[]> {
  return db.getFoodPortions(foodId);
}