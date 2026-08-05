import re

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "r") as f:
    content = f.read()

content = content.replace("onSuccess: (data, text, variables, context) => {", "onSuccess: (data, text) => {")

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "w") as f:
    f.write(content)
