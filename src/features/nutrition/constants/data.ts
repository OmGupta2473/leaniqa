export const IndianFoodsDB: Record<string, string> = {
  'dal chawal': '~620 kcal · 22g protein · 18g fat · 95g carbs — Good base meal, protein is moderate. Add a side of dahi to boost protein.',
  'roti': null,
  'sabzi': null,
  'paneer': '~280 kcal per 100g · 20g protein · 22g fat · Excellent protein source!',
  'paneer tikka': '~380 kcal for 150g · 46g protein · 22g fat — Great high-protein dinner. Perfectly on plan.',
  'biryani': '~650 kcal per plate · 28g protein (with chicken) · 30g fat · 72g carbs — Heavy on carbs. Skip rice at next meal.',
  'chai': '~70 kcal for a cup with milk · 2g protein — Add only 1 sugar or go sugarless.',
  'boiled eggs': '~140 kcal for 2 · 12g protein · 10g fat — Great snack. High satiety per calorie.',
  'egg': '~70 kcal each · 6g protein · 5g fat',
  'puri': '~100 kcal per puri · 2g protein · 5g fat — Deep fried. Limit to 2-3 per meal.',
  'bhindi': '~35 kcal per 100g · 2g protein · Low calorie, high fiber vegetable. ✓',
  'chole': '~350 kcal per cup · 15g protein · 10g fat · 50g carbs — Good protein-to-calorie ratio.',
  'rajma': '~330 kcal per cup · 18g protein · Good plant protein. Pair with roti.',
  'dosa': '~200 kcal · 5g protein · Low protein. Add sambar or egg for protein.',
  'idli': '~130 kcal for 2 · 4g protein · Light option. Add sambar.',
  'sambar': '~80 kcal per cup · 4g protein · Good to add to any south Indian meal.',
  'aloo': '~150 kcal per medium · 3g protein · High carb. Portion carefully.',
  'chicken': '~165 kcal per 100g · 31g protein · Excellent protein source. Preferred lean protein.',
  'fish': '~150 kcal per 100g · 26g protein · Excellent. High protein, healthy fats.',
  'roti sabzi': '~310 kcal for 2 rotis + sabzi · 10g protein · 8g fat · 52g carbs — Standard home meal. Add dal for protein.',
  'chai biscuit': '~140 kcal · 3g protein · Minimal nutrition. Replace biscuits with a boiled egg.'
};

export interface CachedMealMacros {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  confidence: number;
  per100g?: boolean;
}

// Cache keyed by normalized food name
// Values are macros PER SERVING (typical serving) unless per100g is true
// per100g items get multiplied by (quantity / 100) automatically
export const MealMacroCache: Record<string, CachedMealMacros> = {
  // Combined meals (highest priority)
  'roti with soya sabji': { calories: 345, protein: 28, fat: 12, carbs: 40, confidence: 92 },
  '2 roti with soya sabji': { calories: 425, protein: 31, fat: 15, carbs: 55, confidence: 92 },
  
  // Eggs
  'egg': { calories: 70, protein: 6, fat: 5, carbs: 0.5, confidence: 97 },
  'boiled egg': { calories: 70, protein: 6, fat: 5, carbs: 0.5, confidence: 97 },
  'whole egg': { calories: 70, protein: 6, fat: 5, carbs: 0.5, confidence: 97 },
  'egg white': { calories: 17, protein: 4, fat: 0, carbs: 0, confidence: 97 },
  
  // Chicken
  'chicken breast': { calories: 165, protein: 31, fat: 3.6, carbs: 0, confidence: 97, per100g: true },
  'grilled chicken': { calories: 165, protein: 31, fat: 3.6, carbs: 0, confidence: 95, per100g: true },
  'chicken': { calories: 165, protein: 25, fat: 7, carbs: 0, confidence: 88, per100g: true },
  'boiled chicken': { calories: 150, protein: 29, fat: 3, carbs: 0, confidence: 95, per100g: true },
  
  // Milk & dairy
  'milk': { calories: 61, protein: 3.2, fat: 3.3, carbs: 4.8, confidence: 97, per100g: true },
  'whole milk': { calories: 61, protein: 3.2, fat: 3.3, carbs: 4.8, confidence: 97, per100g: true },
  'skimmed milk': { calories: 35, protein: 3.4, fat: 0.1, carbs: 5, confidence: 97, per100g: true },
  'toned milk': { calories: 45, protein: 3.2, fat: 1.5, carbs: 4.8, confidence: 96, per100g: true },
  'curd': { calories: 60, protein: 3.5, fat: 3.3, carbs: 4.7, confidence: 95, per100g: true },
  'dahi': { calories: 60, protein: 3.5, fat: 3.3, carbs: 4.7, confidence: 95, per100g: true },
  'greek yogurt': { calories: 59, protein: 10, fat: 0.4, carbs: 3.6, confidence: 97, per100g: true },
  
  // Paneer & soya
  'paneer': { calories: 265, protein: 18, fat: 20, carbs: 3.4, confidence: 97, per100g: true },
  'low fat paneer': { calories: 130, protein: 18, fat: 4, carbs: 3, confidence: 95, per100g: true },
  'soya chunks': { calories: 336, protein: 52, fat: 0.5, carbs: 33, confidence: 97, per100g: true },
  'soya': { calories: 336, protein: 52, fat: 0.5, carbs: 33, confidence: 93, per100g: true },
  
  // Rice & grains
  'rice': { calories: 130, protein: 2.7, fat: 0.3, carbs: 28, confidence: 93, per100g: true },
  'cooked rice': { calories: 130, protein: 2.7, fat: 0.3, carbs: 28, confidence: 95, per100g: true },
  'white rice': { calories: 130, protein: 2.7, fat: 0.3, carbs: 28, confidence: 95, per100g: true },
  'brown rice': { calories: 112, protein: 2.6, fat: 0.9, carbs: 23, confidence: 95, per100g: true },
  
  // Roti & bread
  'roti': { calories: 120, protein: 4, fat: 2, carbs: 22, confidence: 95 },
  'chapati': { calories: 120, protein: 4, fat: 2, carbs: 22, confidence: 95 },
  'wheat roti': { calories: 120, protein: 4, fat: 2, carbs: 22, confidence: 95 },
  'paratha': { calories: 200, protein: 4, fat: 8, carbs: 28, confidence: 90 },
  
  // Dal & legumes
  'dal': { calories: 116, protein: 8, fat: 0.5, carbs: 20, confidence: 88, per100g: true },
  'moong dal': { calories: 105, protein: 7, fat: 0.4, carbs: 19, confidence: 93, per100g: true },
  'masoor dal': { calories: 116, protein: 9, fat: 0.4, carbs: 20, confidence: 93, per100g: true },
  'rajma': { calories: 127, protein: 9, fat: 0.5, carbs: 22, confidence: 93, per100g: true },
  'chole': { calories: 164, protein: 9, fat: 2.6, carbs: 27, confidence: 93, per100g: true },
  
  // Protein supplements
  'whey protein': { calories: 120, protein: 25, fat: 1, carbs: 3, confidence: 97 },
  'protein shake': { calories: 150, protein: 25, fat: 2, carbs: 8, confidence: 90 },
  'protein powder': { calories: 120, protein: 24, fat: 1.5, carbs: 5, confidence: 88 },
  
  // Vegetables (per 100g)
  'spinach': { calories: 23, protein: 2.9, fat: 0.4, carbs: 3.6, confidence: 97, per100g: true },
  'broccoli': { calories: 34, protein: 2.8, fat: 0.4, carbs: 7, confidence: 97, per100g: true },
  'potato': { calories: 77, protein: 2, fat: 0.1, carbs: 17, confidence: 95, per100g: true },
  
  // Fish
  'fish': { calories: 150, protein: 26, fat: 4, carbs: 0, confidence: 85, per100g: true },
  'salmon': { calories: 208, protein: 20, fat: 13, carbs: 0, confidence: 97, per100g: true },
  'tuna': { calories: 132, protein: 28, fat: 1, carbs: 0, confidence: 97, per100g: true },
  'rohu': { calories: 97, protein: 17, fat: 2, carbs: 0, confidence: 94, per100g: true },
  
  // Indian sabzi / vegetable curries (per serving ~150g bowl)
  'soya sabji': { calories: 185, protein: 22, fat: 6, carbs: 10, confidence: 82 },
  'sabji': { calories: 120, protein: 4, fat: 5, carbs: 15, confidence: 72 },
  'sabzi': { calories: 120, protein: 4, fat: 5, carbs: 15, confidence: 72 },
  'aloo sabji': { calories: 200, protein: 4, fat: 8, carbs: 28, confidence: 80 },
  'bhindi': { calories: 90, protein: 3, fat: 4, carbs: 10, confidence: 84 },
  'palak paneer': { calories: 320, protein: 14, fat: 22, carbs: 16, confidence: 85 },
  'matar paneer': { calories: 310, protein: 13, fat: 20, carbs: 18, confidence: 83 },
  'chana masala': { calories: 180, protein: 9, fat: 5, carbs: 26, confidence: 85 },
  'mixed veg': { calories: 130, protein: 5, fat: 6, carbs: 16, confidence: 75 },
  'aloo gobi': { calories: 160, protein: 4, fat: 7, carbs: 20, confidence: 80 },
  
  // Snacks
  'biscuit': { calories: 50, protein: 1, fat: 2, carbs: 8, confidence: 82 },
  'chai': { calories: 80, protein: 2, fat: 3, carbs: 12, confidence: 85 },
  'bread': { calories: 80, protein: 3, fat: 1, carbs: 15, confidence: 88 },
  'butter': { calories: 100, protein: 0, fat: 11, carbs: 0, confidence: 95 },
  'peanut butter': { calories: 190, protein: 8, fat: 16, carbs: 6, confidence: 94 },
  
  // Common Indian meals
  'dal chawal': { calories: 400, protein: 14, fat: 4, carbs: 78, confidence: 85 },
  'dal rice': { calories: 400, protein: 14, fat: 4, carbs: 78, confidence: 85 },
  'rajma chawal': { calories: 450, protein: 18, fat: 5, carbs: 82, confidence: 85 },
  'chole bhature': { calories: 650, protein: 16, fat: 22, carbs: 95, confidence: 83 },
  'idli': { calories: 65, protein: 2, fat: 0.4, carbs: 14, confidence: 93 },
  'dosa': { calories: 168, protein: 4, fat: 3.7, carbs: 30, confidence: 90 },
  'upma': { calories: 230, protein: 5, fat: 8, carbs: 33, confidence: 85 },
  'poha': { calories: 250, protein: 4, fat: 6, carbs: 44, confidence: 87 },
  'oats': { calories: 68, protein: 2.4, fat: 1.4, carbs: 12, confidence: 95, per100g: true },
  'almonds': { calories: 579, protein: 21, fat: 50, carbs: 22, confidence: 97, per100g: true },
  'banana': { calories: 89, protein: 1.1, fat: 0.3, carbs: 23, confidence: 97 },
  'apple': { calories: 52, protein: 0.3, fat: 0.2, carbs: 14, confidence: 97 },
};

// Smart number extraction from text like "2 eggs", "100g chicken", "3 rotis"
export function extractQuantityAndFood(text: string): { quantity: number; unit: string; foodKey: string } | null {
  const normalized = text.toLowerCase().trim();
  
  // Patterns: "2 eggs", "100g chicken", "1.5 cups rice", "3 rotis"
  const patterns = [
    /^(\d+(?:\.\d+)?)\s*(?:grams?|gm?|g)\s+(.+)$/,   // "100g chicken"
    /^(\d+(?:\.\d+)?)\s*(?:ml|milliliters?)\s+(.+)$/, // "200ml milk"
    /^(\d+(?:\.\d+)?)\s*(?:cups?)\s+(.+)$/,           // "1 cup rice"
    /^(\d+(?:\.\d+)?)\s+(.+)$/,                        // "2 eggs", "3 rotis"
    /^(.+?)\s+(\d+(?:\.\d+)?)\s*(?:g|grams?|gm)$/,   // "chicken 200g"
  ];
  
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      const isGramPattern = pattern.source.includes('grams?|gm');
      const qty = parseFloat(isGramPattern ? match[1] : match[1]);
      const food = (isGramPattern ? match[2] : match[2])?.trim();
      const unit = isGramPattern ? 'g' : 'count';
      if (food && qty > 0) {
        return { quantity: qty, unit, foodKey: food };
      }
    }
  }
  
  return null;
}

// Look up cached macros with quantity scaling
export function lookupCachedMeal(text: string): (CachedMealMacros & { scaledCalories: number; scaledProtein: number; scaledFat: number; scaledCarbs: number }) | null {
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
      multiplier = 1;
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

  // 1. Try EXACT match first (highest precision)
  if (MealMacroCache[searchKey]) {
    return scaleMacros(MealMacroCache[searchKey], quantity, extracted?.unit);
  }

  // 2. Try CONTAINS match (searchKey contains a known food key)
  for (const [key, macros] of Object.entries(MealMacroCache)) {
    if (searchKey === key) continue;
    if (searchKey.includes(key) && searchKey.length - key.length <= 6) {
      return scaleMacros(macros, quantity, extracted?.unit);
    }
  }

  // 3. Try REVERSE CONTAINS (a known key contains the search text)
  for (const [key, macros] of Object.entries(MealMacroCache)) {
    if (key.includes(searchKey)) {
      return scaleMacros(macros, quantity, extracted?.unit);
    }
  }

  return null;
}
