import re

with open("server.ts", "r") as f:
    content = f.read()

old_bread = '"bread": { calories: 265, protein: 9, fat: 3.2, carbs: 49, fiber: 2.7, serving: "100g", perUnit: false }'
new_bread = '"bread": { calories: 75, protein: 2.5, fat: 1, carbs: 14, fiber: 1, serving: "1 slice (30g)", perUnit: true, unitWeight: 30 }'

content = content.replace(old_bread, new_bread)

with open("server.ts", "w") as f:
    f.write(content)
