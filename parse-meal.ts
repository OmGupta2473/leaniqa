export interface MealResult {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  confidence: number;
  foods_detected: string[];
  coaching_tip: string;
}

export interface ParseContext {
  originalText: string;
  normalizedText: string;
  mealType: string;
  remainingCalories: number;
  remainingProtein: number;
  userGoal: string;
  groqApiKey?: string;
  geminiApiKey?: string;
}

export interface MealParser {
  parse(context: ParseContext): Promise<MealResult | null>;
}
