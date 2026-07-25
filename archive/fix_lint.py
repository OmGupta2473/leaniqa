import re

with open('src/features/reports/pages/WeeklyReportPage.tsx', 'r') as f:
    content = f.read()

# Remove streaks calculation block
content = re.sub(r'  const calorieStreak = calculateCurrentCalorieStreak\(dailyMetrics\);\n  const proteinStreak = calculateCurrentProteinStreak\(dailyMetrics\);\n  const earnedAwards = calculateEarnedAwards\(dailyMetrics\);\n', '', content)

# Insert it after dailyMetrics
content = re.sub(
    r'(const \{ data: dailyMetrics = \[\] \} = useQuery\(\{ queryKey: \[\'dailyMetrics\'\], queryFn: \(\) => reportService.getDailyMetrics\(\) \}\);)', 
    r'\1\n  const calorieStreak = calculateCurrentCalorieStreak(dailyMetrics);\n  const proteinStreak = calculateCurrentProteinStreak(dailyMetrics);\n  const earnedAwards = calculateEarnedAwards(dailyMetrics);', 
    content
)

with open('src/features/reports/pages/WeeklyReportPage.tsx', 'w') as f:
    f.write(content)

with open('src/shared/components/Header.tsx', 'r') as f:
    content = f.read()

# Replace multiple duplicate imports with a single one (or just let the first duplicate get removed)
content = content.replace("import { useQuery } from '@tanstack/react-query';\n", "", 1)

with open('src/shared/components/Header.tsx', 'w') as f:
    f.write(content)
