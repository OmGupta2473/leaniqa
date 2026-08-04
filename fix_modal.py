with open("src/features/nutrition/components/CustomMealModal.tsx", "r") as f:
    content = f.read()

content = content.replace("\\`\\${", "`${")
content = content.replace("}%\\`", "}%`")

# Also on line 126
content = content.replace("\\`flex-1", "`flex-1")
content = content.replace("}\\`", "}`")

with open("src/features/nutrition/components/CustomMealModal.tsx", "w") as f:
    f.write(content)
