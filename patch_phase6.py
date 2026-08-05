import re

with open("server.ts", "r") as f:
    content = f.read()

old_ai = """      console.log(`[Orchestrator] Needs AI for: "${normalizedText}"`);
      const prompt = `Analyze this meal: "${text}". Meal type: ${mealType || 'unspecified'}. Remaining today: ${remainingCalories ?? 'unknown'} kcal, ${remainingProtein ?? 'unknown'}g protein. Goal: ${userGoal || 'maintenance'}.`;"""

new_ai = """      // Phase 6: AI Decision Layer
      // Reaching here means the input contains:
      // - Restaurant food
      // - Mixed meals / Complex recipes
      // - Unknown ingredients
      // - Hindi / Hinglish descriptions
      // - Ambiguous quantities or Custom/Street food
      // We explicitly route these complex cases to AI.
      console.log(`[Orchestrator] AI Decision Layer routing to LLM for: "${normalizedText}"`);
      const prompt = `Analyze this meal: "${text}". Meal type: ${mealType || 'unspecified'}. Remaining today: ${remainingCalories ?? 'unknown'} kcal, ${remainingProtein ?? 'unknown'}g protein. Goal: ${userGoal || 'maintenance'}.`;"""

content = content.replace(old_ai, new_ai)

with open("server.ts", "w") as f:
    f.write(content)
