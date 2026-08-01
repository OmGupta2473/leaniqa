import sys
import re

with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'r') as f:
    content = f.read()

# Add failedMealError state
content = content.replace(
    "const [failedMealText, setFailedMealText] = useState<string | null>(null);",
    "const [failedMealText, setFailedMealText] = useState<string | null>(null);\n  const [failedMealError, setFailedMealError] = useState<string | null>(null);"
)

# Update handleSend to reset failedMealError
content = content.replace(
    "setFailedMealText(null);\n    setRetryCount(0);",
    "setFailedMealText(null);\n    setFailedMealError(null);\n    setRetryCount(0);"
)

# Update dismiss to reset failedMealError
content = content.replace(
    "setFailedMealText(null);\n                              setRetryCount(0);",
    "setFailedMealText(null);\n                              setFailedMealError(null);\n                              setRetryCount(0);"
)

with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'w') as f:
    f.write(content)
