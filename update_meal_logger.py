import re

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "r") as f:
    content = f.read()

# 1. Update onSuccess to use the requested format
on_success_pattern = r'    onSuccess: \(data, text\) => \{.*?setLoading\(false\);\n    \},'

on_success_replacement = """    onSuccess: (data, text) => {
      const foodsDetected = Array.isArray(data?.foods_detected) && data?.foods_detected.length > 0 ? data.foods_detected.join(', ') : text;
      
      const newEatenKcal = eatenKcal + Math.round(data.calories);
      const newEatenProtein = eatenProtein + Math.round(data.protein);
      
      const newRemainingKcal = Math.max(0, dailyTargetKcal - newEatenKcal);
      const newRemainingProtein = Math.max(0, proteinTarget - newEatenProtein);

      let responseText = `✅ Logged: ${foodsDetected}

Calories: ${Math.round(data.calories)} kcal
Protein: ${Math.round(data.protein)} g
Fat: ${Math.round(data.fat)} g
Carbs: ${Math.round(data.carbs)} g

Today's Total:
Calories: ${newEatenKcal} kcal
Protein: ${newEatenProtein} g

Remaining:
Calories: ${newRemainingKcal} kcal
Protein: ${newRemainingProtein} g`;

      if (data?.coaching_tip) {
          responseText += `\n\n${data.coaching_tip}`;
      }

      // Add to chat but remove data so we don't double render chips if we're showing it in text
      addChatMessage({ role: 'ai', text: responseText, data: undefined });
      setLoading(false);
    },"""

content = re.sub(on_success_pattern, on_success_replacement, content, flags=re.DOTALL)

# 2. Add whitespace-pre-wrap to the chat message rendering
content = content.replace('<div>{msg.text}</div>', '<div className="whitespace-pre-wrap">{msg.text}</div>')

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "w") as f:
    f.write(content)

