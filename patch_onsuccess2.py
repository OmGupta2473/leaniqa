import sys

with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'r') as f:
    content = f.read()

target = """      if (data._errorMessage) {
        analytics.trackEvent('AI Parse Failure', { error: data._errorMessage, input: text });
        setFailedMealError(data._errorMessage);
      } else if (data.confidence && data.confidence < 80) {
        analytics.trackEvent('AI Parse Failure', { error: 'Low confidence', input: text });
        setFailedMealText(text);
      } else {"""

replacement = """      if (data._errorMessage) {
        analytics.trackEvent('AI Parse Failure', { error: data._errorMessage, input: text });
        setFailedMealError(data._errorMessage);
        setFailedMealText(null);
      } else if (data.confidence && data.confidence < 80) {
        analytics.trackEvent('AI Parse Failure', { error: 'Low confidence', input: text });
        setFailedMealText(text);
        setFailedMealError(null);
      } else {"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'w') as f:
        f.write(content)
    print("Replaced successfully")
else:
    print("Target not found!")
