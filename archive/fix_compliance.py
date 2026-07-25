import re

with open('src/features/reports/services/complianceService.ts', 'r') as f:
    content = f.read()

old_calories = "const actualCalories = meals.reduce<number>((acc, m) => acc + m.calories, 0);"
new_calories = """let actualCalories = 0;
      meals.forEach((m: any) => actualCalories += m.calories);"""

old_protein = "const actualProtein = meals.reduce<number>((acc, m) => acc + m.protein, 0);"
new_protein = """let actualProtein = 0;
      meals.forEach((m: any) => actualProtein += m.protein);"""

content = content.replace(old_calories, new_calories).replace(old_protein, new_protein)

with open('src/features/reports/services/complianceService.ts', 'w') as f:
    f.write(content)
