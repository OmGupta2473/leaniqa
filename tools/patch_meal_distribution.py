import re

with open("src/features/reports/components/MealDistributionChart.tsx", "r") as f:
    content = f.read()

content = content.replace(
    "const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;",
    "const dateStr = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`;"
)

with open("src/features/reports/components/MealDistributionChart.tsx", "w") as f:
    f.write(content)
