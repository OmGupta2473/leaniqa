import re

with open("src/features/nutrition/constants/data.ts", "r") as f:
    content = f.read()

# Update egg
content = content.replace("'egg': { calories: 140, protein: 12, fat: 10, carbs: 1, confidence: 95 },",
                          "'egg': { calories: 72, protein: 6, fat: 5, carbs: 0.5, confidence: 95 },\n  'boiled egg': { calories: 72, protein: 6, fat: 5, carbs: 0.5, confidence: 95 },\n  'boiled eggs': { calories: 72, protein: 6, fat: 5, carbs: 0.5, confidence: 95 },\n  'eggs': { calories: 72, protein: 6, fat: 5, carbs: 0.5, confidence: 95 },")

# Update almonds
content = content.replace("'almonds': { calories: 579, protein: 21, fat: 50, carbs: 22, confidence: 97, per100g: true },",
                          "'almonds': { calories: 579, protein: 21, fat: 50, carbs: 22, confidence: 97, per100g: true, pieceWeightGrams: 1.2 },\n  'almond': { calories: 579, protein: 21, fat: 50, carbs: 22, confidence: 97, per100g: true, pieceWeightGrams: 1.2 },")

# Add sprouts
content = content.replace("'spinach': {",
                          "'sprouts': { calories: 30, protein: 3, fat: 0.2, carbs: 6, confidence: 95, per100g: true, pieceWeightGrams: 100 },\n  'spinach': {")

# Update scaleMacros
scale_macros_pattern = r'  const scaleMacros = \(macros: CachedMealMacros, quantity: number, unit\?: string\) => \{.*?\};\n'

new_scale_macros = """  const scaleMacros = (macros: any, quantity: number, unit?: string) => {
    const isGrams = unit === 'g';
    let multiplier = 1;

    if (macros.per100g && isGrams) {
      multiplier = quantity / 100;
    } else if (macros.per100g && !isGrams) {
      if (macros.pieceWeightGrams) {
         multiplier = (quantity * macros.pieceWeightGrams) / 100;
      } else {
         return null;
      }
    } else if (!macros.per100g && isGrams) {
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
"""

content = re.sub(scale_macros_pattern, new_scale_macros, content, flags=re.DOTALL)

with open("src/features/nutrition/constants/data.ts", "w") as f:
    f.write(content)
