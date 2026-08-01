import sys

with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if "if (data._errorMessage || (data.confidence && data.confidence < 80)) {" in line:
        new_lines.append("""      if (data._errorMessage) {
        analytics.trackEvent('AI Parse Failure', { error: data._errorMessage, input: text });
        setFailedMealError(data._errorMessage);
      } else if (data.confidence && data.confidence < 80) {
        analytics.trackEvent('AI Parse Failure', { error: 'Low confidence', input: text });
        setFailedMealText(text);
      } else {\n""")
        skip = True
        continue
    
    if skip:
        if "} else {" in line:
            skip = False
        continue
        
    new_lines.append(line)

with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'w') as f:
    f.writelines(new_lines)
print("Updated onSuccess successfully")
