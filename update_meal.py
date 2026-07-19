import re

with open('src/LandingPage.tsx', 'r') as f:
    content = f.read()

# 1. Update macros
content = content.replace("const cal = useDemoNumber(425, 1200, state === 'success', 0);", "const cal = useDemoNumber(496, 1200, state === 'success', 0);")
content = content.replace("const pro = useDemoNumber(22.7, 1200, state === 'success', 1);", "const pro = useDemoNumber(20.7, 1200, state === 'success', 1);")
content = content.replace("const fat = useDemoNumber(24.2, 1200, state === 'success', 1);", "const fat = useDemoNumber(13.8, 1200, state === 'success', 1);")
content = content.replace("const carbs = useDemoNumber(30.2, 1200, state === 'success', 1);", "const carbs = useDemoNumber(74.8, 1200, state === 'success', 1);")

# 2. Update food name
content = content.replace("3 eggs curry, 80g boiled cooked rice", "soya sabji + 3 roti")

# 3. Replace Gemini AI Insight with AI Insight
content = content.replace("Gemini AI Insight", "AI Insight")

# 4. Update the insight text to match the new meal
content = content.replace(
    "Great choice! This meal provides excellent lean protein from eggs, perfectly balanced with energy-sustaining carbs from the rice.",
    "Great choice! This meal provides a good source of plant-based protein from soya, perfectly balanced with energy-sustaining carbs from the roti."
)

with open('src/LandingPage.tsx', 'w') as f:
    f.write(content)
print("Updated successfully")
