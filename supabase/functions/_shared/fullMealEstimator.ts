/**
 * R3 shared type definitions.
 *
 * Reconstruction of the type-only module originally at this path.
 *
 * The original file was untracked (never committed) and its full
 * implementation was lost in a `git clean -fd` on 2026-10-24. This file
 * declares only the five `export type` / `export interface` symbols that
 * surviving R3 code (`foodResolverV2.ts`) imports. No runtime logic.
 *
 * Reconstructed from:
 *   - the import at foodResolverV2.ts:23-29
 *   - field access at foodResolverV2.ts:207-212, 217-219, 1284-1287, 1385-1390
 *
 * If the original file is ever recovered from a backup, replace this file.
 * Until then, this is the canonical R3 shape.
 */

export type NutritionBasis = 'raw' | 'cooked' | 'finished' | 'unknown';

export type MealComponentRole =
  | 'protein'
  | 'carb'
  | 'fat'
  | 'vegetable'
  | 'mixed'
  | 'oil'
  | 'other';

export interface MealComponent {
  label: string;
  role: MealComponentRole;
  nutrition_basis: NutritionBasis;
  food_id?: number | null;
  quantity?: number;
  unit?: string | null;
  grams?: number | null;
  calories?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  fiber_g?: number | null;
  preparation?: string | null;
  added_oil?: {
    status:
      | 'explicitly_none'
      | 'explicit_quantity'
      | 'inferred_included'
      | 'unknown';
    quantity_g?: number | null;
  } | null;
  assumption?: string | null;
}

export interface UnresolvedMealComponent {
  label: string;
  input_term?: string;
  quantity?: number;
  unit?: string | null;
  reason?: string;
}

export interface MealInterpretation {
  schema_version?: string;
  meal_title?: string;
  components: MealComponent[];
  unresolved_components: UnresolvedMealComponent[];
  assumptions: string[];
  confidence?: number;
  needs_review?: boolean;
}