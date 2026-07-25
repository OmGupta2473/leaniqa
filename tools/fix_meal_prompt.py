import re

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "r") as f:
    content = f.read()

pattern = r"body: \{ text, remainingCalories, remainingProtein, mealType: selectedMealSlot \}"
replacement = "body: { text, remainingCalories, remainingProtein, mealType: selectedMealSlot, userGoal: goal?.goal_type || 'maintenance' }"

content = content.replace(pattern, replacement)

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "w") as f:
    f.write(content)

with open("supabase/functions/parse-meal/index.ts", "r") as f:
    content = f.read()

edge_pattern = r"const contents = `You are a precise nutrition expert for Indian and international foods. Analyze this meal: \"\$\{text\}\"\. Meal type: \$\{mealType \|\| 'unspecified'\}\. The user has \$\{remainingCalories \?\? 'unknown'\} kcal remaining today and needs \$\{remainingProtein \?\? 'unknown'\}g more protein\.Instructions:\n1\. Identify each food item and its exact quantity from the text. Never default to 100g unless explicitly specified in grams\.\n2\. Apply quantity scaling strictly\. Final nutrition MUST be: Serving Nutrition \* Quantity\.\n3\. Standard conversions: 1 egg = 50g, 1 almond = 1\.2g, 1 medium banana, 1 bowl sprouts, 1 cup rice, 1 roti = 40g, dal bowl = 200g, sabzi = 150g\.\n4\. Confidence: 95-100 for named items with quantities, 80-94 for named items without quantities, 60-79 for ambiguous descriptions\n5\. Coaching tip: be specific, mention the user's remaining macros, suggest one concrete next action\nRespond with valid JSON only\.`;"

edge_replacement = """const userGoal = reqData.userGoal || 'maintenance';
        const contents = `You are a precise nutrition expert for Indian and international foods. Analyze this meal: "${text}". Meal type: ${mealType || 'unspecified'}. The user has ${remainingCalories ?? 'unknown'} kcal remaining today and needs ${remainingProtein ?? 'unknown'}g more protein. User's goal: ${userGoal}.
Instructions:
1. Identify each food item and its exact quantity from the text. Never default to 100g unless explicitly specified in grams.
2. Apply quantity scaling strictly. Final nutrition MUST be: Serving Nutrition * Quantity.
3. Standard conversions: 1 egg = 50g, 1 almond = 1.2g, 1 medium banana, 1 bowl sprouts, 1 cup rice, 1 roti = 40g, dal bowl = 200g, sabzi = 150g.
4. Confidence: 95-100 for named items with quantities, 80-94 for named items without quantities, 60-79 for ambiguous descriptions.
5. Coaching tip: Generate personalized recommendations based on the user's remaining daily targets and goal.
   - If protein is low, suggest high-protein foods.
   - If calories are almost exhausted, recommend low-calorie protein sources.
   - If both targets are nearly achieved, acknowledge good progress.
   - Keep it concise, natural, and context-aware.
Respond with valid JSON only.`;"""

content = re.sub(edge_pattern, edge_replacement, content, flags=re.DOTALL)

with open("supabase/functions/parse-meal/index.ts", "w") as f:
    f.write(content)
