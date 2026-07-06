import re

with open('src/features/dashboard/pages/DashboardPage.tsx', 'r') as f:
    content = f.read()

content = content.replace("  const eatenKcal = useMemo(() => todaysMeals.reduce((acc, m) => acc + m.calories, 0), [todaysMeals]);", "  const eatenKcal = todaysMeals.reduce((acc, m) => acc + m.calories, 0);")
content = content.replace("  const eatenProtein = useMemo(() => todaysMeals.reduce((acc, m) => acc + m.protein, 0), [todaysMeals]);", "  const eatenProtein = todaysMeals.reduce((acc, m) => acc + m.protein, 0);")

with open('src/features/dashboard/pages/DashboardPage.tsx', 'w') as f:
    f.write(content)
