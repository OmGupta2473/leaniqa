import re

with open("src/features/nutrition/constants/data.ts", "r") as f:
    content = f.read()

# Replace lookupCachedMeal
lookup_pattern = r'export function lookupCachedMeal.*?return null;\n\}'

new_lookup = """export function lookupCachedMeal(text: string): (CachedMealMacros & { scaledCalories: number; scaledProtein: number; scaledFat: number; scaledCarbs: number }) | null {
  const normalized = text.toLowerCase().trim();
  const extracted = extractQuantityAndFood(normalized);
  const searchKey = extracted?.foodKey || normalized;

  // Helper to scale macros
  const scaleMacros = (macros: CachedMealMacros, quantity: number, unit?: string) => {
    const isGrams = unit === 'g';
    let multiplier = 1;

    if (macros.per100g && isGrams) {
      multiplier = quantity / 100;
    } else if (macros.per100g && !isGrams) {
      // If it's a per100g food but user specified count (e.g. 4 almonds)
      // We should not reuse the cache if we don't have the per-piece conversion in cache!
      // But we will handle standard piece weights below, or return null to let AI handle it.
      return null;
    } else if (!macros.per100g && isGrams) {
       // user specified grams but cache is per piece
       return null;
    } else {
      multiplier = quantity;
    }

    return {
      ...macros,
      scaledCalories: Math.round(macros.calories * multiplier),
      scaledProtein: Math.round(macros.protein * multiplier * 10) / 10,
      scaledFat: Math.round(macros.fat * multiplier * 10) / 10,
      scaledCarbs: Math.round(macros.carbs * multiplier * 10) / 10,
    };
  };

  const quantity = extracted?.quantity ?? 1;

  // STRICT matching. We only use EXACT match for the food key.
  // If it's not an exact match, we return null to force AI parsing.
  if (MealMacroCache[searchKey]) {
    const result = scaleMacros(MealMacroCache[searchKey], quantity, extracted?.unit);
    return result; // Can be null if unit mismatch
  }
  
  // No fuzzy matching allowed per rules!
  return null;
}"""

content = re.sub(lookup_pattern, new_lookup, content, flags=re.DOTALL)

with open("src/features/nutrition/constants/data.ts", "w") as f:
    f.write(content)
