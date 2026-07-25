import re

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "r") as f:
    content = f.read()

content = content.replace("console.log(\"Parsed Food Name:\", cachedResult.baseFood);", "console.log(\"Parsed Food Name:\", text);")
content = content.replace("console.log(\"Parsed Quantity:\", cachedResult.parsedQuantity);", "")
content = content.replace("console.log(\"Parsed Unit:\", cachedResult.parsedUnit);", "")

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "w") as f:
    f.write(content)
