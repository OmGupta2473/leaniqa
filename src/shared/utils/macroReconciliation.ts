/**
 * Pure reconciliation of calorie target and macro split for non-cut goals.
 *
 * For Recomp and Bulk, protein and fat come from bodyweight × activity-adjusted
 * g/kg. Carbohydrates absorb the remaining calories. That makes target_kcal the
 * source of truth and carbs a derived value.
 *
 * Cut goals use a different model (paceEngine) and do not call into this file.
 *
 * The utility never mutates and never throws on infeasible macro splits.
 * Infeasibility is reported via a flag so callers can gate their own UI.
 */

export interface MacroReconciliationResult {
  /** Derived carbohydrate grams. Zero when the split is infeasible. */
  carbsG: number;
  /** kcal remaining after protein and fat: kcal - proteinG*4 - fatG*9. */
  remainderKcal: number;
  /** False when protein + fat alone exceed the calorie target. */
  feasible: boolean;
}

const KCAL_PER_G_PROTEIN = 4;
const KCAL_PER_G_CARB = 4;
const KCAL_PER_G_FAT = 9;

function assertFiniteNonNegative(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a finite non-negative number`);
  }
}

export function deriveCarbsFromKcal(
  kcal: number,
  proteinG: number,
  fatG: number,
): MacroReconciliationResult {
  assertFiniteNonNegative(kcal, 'kcal');
  assertFiniteNonNegative(proteinG, 'proteinG');
  assertFiniteNonNegative(fatG, 'fatG');

  const proteinKcal = proteinG * KCAL_PER_G_PROTEIN;
  const fatKcal = fatG * KCAL_PER_G_FAT;
  const remainderKcal = kcal - proteinKcal - fatKcal;

  if (remainderKcal < 0) {
    return { carbsG: 0, remainderKcal, feasible: false };
  }

  const carbsG = Math.round(remainderKcal / KCAL_PER_G_CARB);
  return { carbsG, remainderKcal, feasible: true };
}

export function isMacroSplitFeasible(
  kcal: number,
  proteinG: number,
  fatG: number,
): boolean {
  return deriveCarbsFromKcal(kcal, proteinG, fatG).feasible;
}