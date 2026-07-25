import re

with open("src/features/reports/components/MealDistributionChart.tsx", "r") as f:
    content = f.read()

content = content.replace("m.meal_type || 'breakfast'", "m.meal_slot || 'breakfast'")

with open("src/features/reports/components/MealDistributionChart.tsx", "w") as f:
    f.write(content)
