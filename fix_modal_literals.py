import re

with open("src/features/nutrition/components/CustomMealModal.tsx", "r") as f:
    content = f.read()

content = content.replace("\\${", "${")

with open("src/features/nutrition/components/CustomMealModal.tsx", "w") as f:
    f.write(content)
