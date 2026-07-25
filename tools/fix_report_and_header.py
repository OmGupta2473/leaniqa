import re

with open('src/features/reports/pages/WeeklyReportPage.tsx', 'r') as f:
    content = f.read()
content = content.replace("import { useStreaks } from '@/shared/hooks/useStreaks';", "import { calculateCurrentCalorieStreak, calculateCurrentProteinStreak, calculateEarnedAwards } from '@/shared/utils/streaks';")
replacement = """
  const calorieStreak = calculateCurrentCalorieStreak(dailyMetrics);
  const proteinStreak = calculateCurrentProteinStreak(dailyMetrics);
  const earnedAwards = calculateEarnedAwards(dailyMetrics);
"""
content = re.sub(r'const \{ calorieStreak, proteinStreak, earnedAwards \} = useStreaks\(\);', replacement, content)
with open('src/features/reports/pages/WeeklyReportPage.tsx', 'w') as f:
    f.write(content)

with open('src/shared/components/Header.tsx', 'r') as f:
    content = f.read()
content = content.replace("import { useStreaks } from '@/shared/hooks/useStreaks';", "import { useQuery } from '@tanstack/react-query';\nimport { reportService } from '@/features/reports';\nimport { calculateEarnedAwards } from '@/shared/utils/streaks';")
replacement = """
  const { data: metrics = [] } = useQuery({ queryKey: ['dailyMetrics'], queryFn: () => reportService.getDailyMetrics() });
  const earnedAwards = calculateEarnedAwards(metrics);
"""
content = re.sub(r'const \{ earnedAwards \} = useStreaks\(\);', replacement, content)
with open('src/shared/components/Header.tsx', 'w') as f:
    f.write(content)
