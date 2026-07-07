import re

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "r") as f:
    content = f.read()

on_success_pattern = r'    onSuccess: \(data, text\) => \{.*?\n      let responseText ='

on_success_replacement = """    onSuccess: (data, text) => {
      const foodsDetected = Array.isArray(data?.foods_detected) && data?.foods_detected.length > 0 ? data.foods_detected.join(', ') : text;
      
      const newEatenKcal = eatenKcal + Math.round(data.calories);
      const newEatenProtein = eatenProtein + Math.round(data.protein);
      
      const newRemainingKcal = Math.max(0, dailyTargetKcal - newEatenKcal);
      const newRemainingProtein = Math.max(0, proteinTarget - newEatenProtein);

      console.group('Meal Parsing Audit: ' + text);
      console.log('User Input:', text);
      console.log('Parsed Food:', foodsDetected);
      console.log('Final Nutrition:', {
        calories: data.calories,
        protein: data.protein,
        fat: data.fat,
        carbs: data.carbs
      });
      console.log('Updated Daily Totals:', {
        calories: newEatenKcal,
        protein: newEatenProtein
      });
      console.log('Remaining Targets:', {
        calories: newRemainingKcal,
        protein: newRemainingProtein
      });
      console.groupEnd();

      let responseText ="""

content = re.sub(on_success_pattern, on_success_replacement, content, flags=re.DOTALL)

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "w") as f:
    f.write(content)

