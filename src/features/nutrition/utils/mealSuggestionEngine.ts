export type DietaryPreference = 'veg' | 'egg' | 'nonveg' | null | undefined;

export interface MealSuggestion {
  id: string;
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  diet: 'veg' | 'egg' | 'nonveg';
}

// Curated combinations from the LeanIQA Knowledge Base
const MEAL_DB: Omit<MealSuggestion, 'id'>[] = [
  // --- VEG ---
  { name: '2 Roti + 1 Bowl Dal + 100g Paneer', kcal: 450, protein: 35, carbs: 50, fat: 15, diet: 'veg' },
  { name: '1 Bowl Rice + 1 Bowl Rajma', kcal: 350, protein: 15, carbs: 65, fat: 2, diet: 'veg' },
  { name: '2 Roti + 1 Bowl Mixed Veg + 1 Bowl Curd', kcal: 420, protein: 18, carbs: 55, fat: 12, diet: 'veg' },
  { name: 'Greek Yogurt (150g) + 1 Banana + 10 Almonds', kcal: 300, protein: 17, carbs: 30, fat: 14, diet: 'veg' },
  { name: '1 Bowl Poha + 1 Glass Milk', kcal: 330, protein: 8, carbs: 50, fat: 8, diet: 'veg' },
  { name: '1 Bowl Khichdi + 1 Bowl Curd', kcal: 350, protein: 15, carbs: 50, fat: 9, diet: 'veg' },
  { name: 'Whey Protein (1 Scoop) + 1 Apple', kcal: 250, protein: 26, carbs: 20, fat: 2, diet: 'veg' },
  { name: '1 Bowl Oats + 1 Glass Milk + 1 Scoop Whey', kcal: 450, protein: 35, carbs: 55, fat: 8, diet: 'veg' },
  { name: '1 Bowl Soya Chunks Curry + 2 Roti', kcal: 400, protein: 32, carbs: 45, fat: 10, diet: 'veg' },
  { name: '1 Bowl Chole + 1 Bowl Rice', kcal: 420, protein: 16, carbs: 75, fat: 5, diet: 'veg' },
  
  // --- EGG ---
  { name: '3 Eggs + 2 Roti', kcal: 380, protein: 28, carbs: 45, fat: 12, diet: 'egg' },
  { name: '2 Roti + 1 Bowl Egg Curry', kcal: 390, protein: 20, carbs: 48, fat: 14, diet: 'egg' },
  { name: '1 Bowl Egg Fried Rice', kcal: 380, protein: 18, carbs: 55, fat: 10, diet: 'egg' },
  { name: '2 Boiled Eggs + 1 Bowl Oats', kcal: 350, protein: 22, carbs: 40, fat: 12, diet: 'egg' },

  // --- NON-VEG ---
  { name: '1 Bowl Chicken Curry + 1 Bowl Rice', kcal: 405, protein: 25, carbs: 46, fat: 12, diet: 'nonveg' },
  { name: '2 Roti + 100g Grilled Chicken Breast + Salad', kcal: 400, protein: 45, carbs: 42, fat: 6, diet: 'nonveg' },
  { name: '2 Roti + 1 Bowl Fish Curry', kcal: 380, protein: 22, carbs: 46, fat: 10, diet: 'nonveg' },
  { name: '2 Roti + 100g Chicken Tikka', kcal: 420, protein: 35, carbs: 45, fat: 12, diet: 'nonveg' },
  { name: '1 Bowl Mutton Curry + 1 Bowl Rice', kcal: 450, protein: 26, carbs: 46, fat: 18, diet: 'nonveg' },
];

export function getMealSuggestions(
  remaining: { kcal: number; protein: number; carbs: number; fat: number },
  milestone: number,
  preference: DietaryPreference
): MealSuggestion[] {
  let allowedDiets = ['veg'];
  if (preference === 'nonveg') {
    allowedDiets = ['veg', 'egg', 'nonveg'];
  } else if (preference === 'egg') {
    allowedDiets = ['veg', 'egg'];
  }

  const filteredDB = MEAL_DB.filter((meal) => allowedDiets.includes(meal.diet));

  const scored = filteredDB.map((meal, i) => {
    // 1. Penalize overshooting calories heavily
    const kcalDiff = meal.kcal - remaining.kcal;
    const kcalPenalty = kcalDiff > 0 ? kcalDiff * 3 : Math.abs(kcalDiff);
    
    // 2. Penalize missing the remaining macros (protein is weighted highest)
    const proGap = Math.abs(meal.protein - remaining.protein) * 8;
    const carbGap = Math.abs(meal.carbs - remaining.carbs) * 2;
    const fatGap = Math.abs(meal.fat - remaining.fat) * 4;
    
    // 3. Milestone rotation: Shifts the top suggestions slightly every 1/3 of the day
    const rotationBias = Math.sin(milestone * 10 + i) * 40;
    
    const score = kcalPenalty + proGap + carbGap + fatGap + rotationBias;
    
    return { ...meal, score, id: `meal-${i}` };
  });

  // Return top 3 matches
  return scored
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map(({ score, ...m }) => m);
}