import re

with open('src/features/dashboard/pages/DashboardPage.tsx', 'r') as f:
    content = f.read()

# Add useMemo import if missing
if 'useMemo' not in content:
    content = content.replace('useQueryClient } from "@tanstack/react-query";', 'useQueryClient } from "@tanstack/react-query";\nimport { useMemo } from "react";')

old_eaten = """  const eatenKcal = todaysMeals.reduce((acc, m) => acc + m.calories, 0);
  const eatenProtein = todaysMeals.reduce((acc, m) => acc + m.protein, 0);"""

new_eaten = """  const eatenKcal = useMemo(() => todaysMeals.reduce((acc, m) => acc + m.calories, 0), [todaysMeals]);
  const eatenProtein = useMemo(() => todaysMeals.reduce((acc, m) => acc + m.protein, 0), [todaysMeals]);"""

content = content.replace(old_eaten, new_eaten)

with open('src/features/dashboard/pages/DashboardPage.tsx', 'w') as f:
    f.write(content)
