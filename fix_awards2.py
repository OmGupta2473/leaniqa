import re

with open('src/features/awards/pages/AwardsPage.tsx', 'r') as f:
    content = f.read()

# Replace the calorieStreak usage with earnedAwards logic.
# Wait, let's just define them locally in the component from earnedAwards.

replacement = """  const { data: metrics = [] } = useQuery({ queryKey: ["dailyMetrics"], queryFn: () => reportService.getDailyMetrics() });
  const earnedAwards = calculateEarnedAwards(metrics);
  const calorieStreak = earnedAwards.find(a => a.category === 'calories')?.currentStreak || 0;
  const proteinStreak = earnedAwards.find(a => a.category === 'protein')?.currentStreak || 0;
"""

content = re.sub(r'const \{ data: metrics = \[\] \} = useQuery.*?const earnedAwards = calculateEarnedAwards\(metrics\);', replacement, content, flags=re.DOTALL)

with open('src/features/awards/pages/AwardsPage.tsx', 'w') as f:
    f.write(content)
