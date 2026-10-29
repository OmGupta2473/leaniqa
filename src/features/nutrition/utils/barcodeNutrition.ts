/**
 * Pure helpers for barcode-scanned products. No I/O, no React, fully testable.
 *
 * The edge function `lookup-barcode` returns a `BarcodeProduct` shape and
 * pre-computes `detected_default_unit` and `unit_weights`. This util only
 * turns (quantity, unit) into grams and grams into macros — the same math
 * the rule engine in `parse-meal` does for KB foods.
 */

export type BarcodeUnit =
  | 'g' | 'ml' | 'piece' | 'scoop' | 'tbsp' | 'tsp'
  | 'bowl' | 'cup' | 'serving' | 'glass' | 'bottle';

export interface BarcodeNutritionPer100g {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
}

export interface BarcodeProduct {
  barcode: string;
  product_name: string | null;
  brand: string | null;
  image_url: string | null;
  nutrition_per_100g: BarcodeNutritionPer100g;
  serving_size: number | null;
  serving_size_unit: 'g' | 'ml' | null;
  detected_default_unit: BarcodeUnit;
  unit_weights: Partial<Record<BarcodeUnit, number>>;
  source: 'openfoodfacts' | 'edamam' | 'fatsecret' | 'nutritionix' | 'manual';
}

export interface BarcodeMacros {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
}

/** Ordered list of units the user can pick for this product. */
export function availableUnits(product: BarcodeProduct): BarcodeUnit[] {
  const units: BarcodeUnit[] = [product.detected_default_unit];
  for (const u of Object.keys(product.unit_weights) as BarcodeUnit[]) {
    if (!units.includes(u)) units.push(u);
  }
  return units;
}

/** Grams-per-unit for a given unit, or null if unknown. */
export function unitWeightGrams(
  unit: BarcodeUnit,
  product: BarcodeProduct,
): number | null {
  const w = product.unit_weights[unit];
  return typeof w === 'number' && w > 0 ? w : null;
}

/** Grams from a user quantity + chosen unit. Null when the unit weight is unknown. */
export function calcGrams(
  quantity: number,
  unit: BarcodeUnit,
  product: BarcodeProduct,
): number | null {
  if (!Number.isFinite(quantity) || quantity <= 0) return null;
  const w = unitWeightGrams(unit, product);
  return w != null ? Math.round(quantity * w * 10) / 10 : null;
}

/** Macros from grams consumed. Nutrition is stored per-100g, so scale by grams/100. */
export function calcMacros(product: BarcodeProduct, grams: number): BarcodeMacros {
  const scale = grams / 100;
  const n = product.nutrition_per_100g;
  return {
    calories: Math.round(n.kcal * scale),
    protein: Math.round(n.protein * scale * 10) / 10,
    fat: Math.round(n.fat * scale * 10) / 10,
    carbs: Math.round(n.carbs * scale * 10) / 10,
    fiber: Math.round(n.fiber * scale * 10) / 10,
  };
}

/** Display label per unit. */
export function unitLabel(unit: BarcodeUnit): string {
  switch (unit) {
    case 'g': return 'g';
    case 'ml': return 'ml';
    case 'piece': return 'piece';
    case 'scoop': return 'scoop';
    case 'tbsp': return 'tbsp';
    case 'tsp': return 'tsp';
    case 'bowl': return 'bowl';
    case 'cup': return 'cup';
    case 'serving': return 'serving';
    case 'glass': return 'glass';
    case 'bottle': return 'bottle';
  }
}