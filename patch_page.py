import re

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "r") as f:
    content = f.read()

# Replace the step 1 cache block to add logging
old_step_1 = """      // ── STEP 1: Cache lookup — only for simple single-food entries ────────────
      if (!isCompoundMeal) {
        const cachedResult = lookupCachedMeal(text);
        if (cachedResult && cachedResult.confidence >= 90) {
          await mealService.addMeal({ meal_text: text, calories: cachedResult.scaledCalories, protein: cachedResult.scaledProtein, fat: cachedResult.scaledFat, carbs: cachedResult.scaledCarbs, meal_time: getMealTime().toISOString(), tip: text, meal_slot: selectedMealSlot || undefined });
          return { calories: cachedResult.scaledCalories, protein: cachedResult.scaledProtein, fat: cachedResult.scaledFat, carbs: cachedResult.scaledCarbs, confidence: cachedResult.confidence, foods_detected: [text], coaching_tip: `Logged from nutritional database. ${Math.round(cachedResult.scaledCalories)} kcal · ${cachedResult.scaledProtein}g protein`, _fromCache: true };
        }
      }"""

new_step_1 = """      // ── STEP 1: Cache lookup — only for simple single-food entries ────────────
      console.log("=== MEAL LOGGING PIPELINE START ===");
      console.log("User Input:", text);
      
      if (!isCompoundMeal) {
        const cachedResult = lookupCachedMeal(text);
        if (cachedResult && cachedResult.confidence >= 90) {
          console.log("Nutrition Source Used: Cache");
          console.log("Parsed Food Name:", cachedResult.baseFood);
          console.log("Parsed Quantity:", cachedResult.parsedQuantity);
          console.log("Parsed Unit:", cachedResult.parsedUnit);
          console.log("Nutrition Values Returned:", cachedResult);
          try {
             await mealService.addMeal({ meal_text: text, calories: cachedResult.scaledCalories, protein: cachedResult.scaledProtein, fat: cachedResult.scaledFat, carbs: cachedResult.scaledCarbs, meal_time: getMealTime().toISOString(), tip: text, meal_slot: selectedMealSlot || undefined });
          } catch (e) {
             console.error("Complete Error Stack:", e);
             throw e;
          }
          return { calories: cachedResult.scaledCalories, protein: cachedResult.scaledProtein, fat: cachedResult.scaledFat, carbs: cachedResult.scaledCarbs, confidence: cachedResult.confidence, foods_detected: [text], coaching_tip: `Logged from nutritional database. ${Math.round(cachedResult.scaledCalories)} kcal · ${cachedResult.scaledProtein}g protein`, _fromCache: true };
        }
      }
      console.log("Nutrition Source Used: AI / Function");"""

content = content.replace(old_step_1, new_step_1)

# Modify onError to show the real error
old_onerror = """    onError: (err) => {
      // This should be UNREACHABLE after the STEP 3 fix.
      // If you see this in production, it means mutationFn is still throwing somewhere.
      console.error('[addMealMutation] onError fired — mutationFn threw unexpectedly:', err);
      addChatMessage({ role: 'ai', text: '⚠️ Something unexpected happened. Please try again.' });
      setLoading(false);
    },"""

new_onerror = """    onError: (err: any) => {
      console.error('[addMealMutation] onError fired — mutationFn threw unexpectedly:', err);
      console.error('Complete Error Stack:', err.stack || err);
      const errorMessage = typeof err === 'object' ? JSON.stringify(err, null, 2) : String(err);
      addChatMessage({ role: 'ai', text: `⚠️ Error occurred: ${errorMessage}` });
      setLoading(false);
    },"""

content = content.replace(old_onerror, new_onerror)

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "w") as f:
    f.write(content)
