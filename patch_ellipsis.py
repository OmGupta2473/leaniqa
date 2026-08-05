import re

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "r") as f:
    content = f.read()

content = content.replace('"Analyzing meal...",', '"Analyzing meal…",')
content = content.replace('"Estimating portions...",', '"Estimating portions…",')
content = content.replace('"Calculating nutrition...",', '"Calculating nutrition…",')
content = content.replace('"Checking confidence...",', '"Checking confidence…",')
content = content.replace('"Preparing recommendations..."', '"Preparing recommendations…"')

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "w") as f:
    f.write(content)
