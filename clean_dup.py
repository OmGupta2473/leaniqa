with open("src/features/nutrition/pages/MealLoggerPage.tsx", "r") as f:
    content = f.read()

content = content.replace(
    "const [isCustomMealModalOpen, setIsCustomMealModalOpen] = useState(false);\n  const [isCustomMealModalOpen, setIsCustomMealModalOpen] = useState(false);",
    "const [isCustomMealModalOpen, setIsCustomMealModalOpen] = useState(false);"
)

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "w") as f:
    f.write(content)
