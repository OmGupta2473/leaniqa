import re

with open('src/features/dashboard/pages/DashboardPage.tsx', 'r') as f:
    content = f.read()

# Replace the useStreaks import and usage
content = content.replace('import { useStreaks } from "@/shared/hooks/useStreaks";', 'import { useQuery } from "@tanstack/react-query";\nimport { reportService } from "@/features/reports";\nimport { calculateCurrentCalorieStreak, calculateCurrentProteinStreak } from "@/shared/utils/streaks";')

# We need to find `const { calorieStreak, proteinStreak } = useStreaks();`
# And replace it with fetching metrics and calling the new functions directly.

replacement = """  const { data: metrics = [] } = useQuery({ queryKey: ["dailyMetrics"], queryFn: () => reportService.getDailyMetrics() });
  const calorieStreak = calculateCurrentCalorieStreak(metrics);
  const proteinStreak = calculateCurrentProteinStreak(metrics);"""

content = re.sub(r'const \{ calorieStreak, proteinStreak \} = useStreaks\(\);', replacement, content)

with open('src/features/dashboard/pages/DashboardPage.tsx', 'w') as f:
    f.write(content)
