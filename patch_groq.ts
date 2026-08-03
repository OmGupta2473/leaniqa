import { readFileSync, writeFileSync } from 'fs';

const file = 'supabase/functions/parse-meal/index.ts';
let code = readFileSync(file, 'utf8');

const oldPrompt = "const prompt = `Analyze this meal: \\\"${context.originalText}\\\". Meal type: ${context.mealType}. Generate structured JSON only. Never generate conversational text or markdown blocks.\\n\\nFormat:\\n{\\n  \\\"calories\\\": number,\\n  \\\"protein\\\": number,\\n  \\\"fat\\\": number,\\n  \\\"carbs\\\": number,\\n  \\\"confidence\\\": number, // 0-100\\n  \\\"foods_detected\\\": string[],\\n  \\\"coaching_tip\\\": string\\n}`;";

const newPrompt = "const prompt = `You are a precise nutrition expert for Indian and international foods. Analyze this meal: \"${context.originalText}\". Meal type: ${context.mealType || 'unspecified'}. The user has ${context.remainingCalories ?? 'unknown'} kcal remaining today and needs ${context.remainingProtein ?? 'unknown'}g more protein. User's goal: ${context.userGoal}.\\n\\nInstructions:\\n1. Identify each food item and its exact quantity from the text. Never default to 100g unless explicitly specified in grams.\\n2. Apply quantity scaling strictly. Final nutrition MUST be: Serving Nutrition * Quantity.\\n3. Standard conversions: 1 egg = 50g, 1 almond = 1.2g, 1 medium banana, 1 bowl sprouts, 1 cup rice, 1 roti = 40g, dal bowl = 200g, sabzi = 150g.\\n4. Confidence: 95-100 for named items with quantities, 80-94 for named items without quantities, 60-79 for ambiguous descriptions.\\n5. Coaching tip: Generate personalized recommendations based on the user's remaining daily targets and goal.\\n\\nGenerate structured JSON only. Never generate conversational text or markdown blocks.\\n\\nFormat:\\n{\\n  \"calories\": number,\\n  \"protein\": number,\\n  \"fat\": number,\\n  \"carbs\": number,\\n  \"confidence\": number,\\n  \"foods_detected\": string[],\\n  \"coaching_tip\": string\\n}`;";

code = code.replace(oldPrompt, newPrompt);
writeFileSync(file, code);
