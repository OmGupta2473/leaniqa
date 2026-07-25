import re

with open('src/features/awards/pages/AwardsPage.tsx', 'r') as f:
    content = f.read()

if 'useMemo' not in content:
    content = content.replace("import { useAwardStore }", "import { useMemo } from 'react';\nimport { useAwardStore }")

old_earned = """  const earnedAwards = calculateEarnedAwards(metrics);
  
  const calorieStreak = calculateCurrentStreak(metrics, 'calories');
  const proteinStreak = calculateCurrentStreak(metrics, 'protein');"""

new_earned = """  const earnedAwards = useMemo(() => calculateEarnedAwards(metrics), [metrics]);
  
  const calorieStreak = useMemo(() => calculateCurrentStreak(metrics, 'calories'), [metrics]);
  const proteinStreak = useMemo(() => calculateCurrentStreak(metrics, 'protein'), [metrics]);"""

content = content.replace(old_earned, new_earned)

with open('src/features/awards/pages/AwardsPage.tsx', 'w') as f:
    f.write(content)
