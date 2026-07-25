import re

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "r") as f:
    content = f.read()

pattern = r'      let responseText = `✅ Logged: \$\{foodsDetected\}(.*?)addChatMessage\(\{ role: \'ai\', text: responseText, data: undefined \}\);'

replacement = """      let responseText = `✓ Logged: ${foodsDetected}`;
      if (data?._localOnly) {
        responseText = `Saved locally — will sync when connection is restored.`;
      } else if (data?._fromCache) {
        responseText = `✓ Logged: ${foodsDetected}`;
      } else if (data?._errorMessage) {
        responseText = `📊 Estimated: ${foodsDetected}`;
      }
      
      const confidence = data?.confidence ?? 0;
      const confidenceTag = (confidence >= 90 || data?._localOnly) ? '' : ` · ${confidence}% confidence`;
      
      addChatMessage({ role: 'ai', text: responseText + confidenceTag, data });"""

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "w") as f:
    f.write(content)
