import re

with open('src/features/nutrition/pages/CalorieDetailPage.tsx', 'r') as f:
    content = f.read()

content = content.replace('import { useStreaks } from "@/shared/hooks/useStreaks";', 'import { useStreaks } from "@/shared/hooks/useStreaks";\nimport { calculateBestCalorieStreak, calculateEarnedAwards, calculateCurrentCalorieStreak } from "@/shared/utils/streaks";')

# Replace the useMemo with just calling the function
pattern = re.compile(r'const allTimeBestCalStreak = useMemo\(\(\) => \{.*?\}, \[metrics\]\);', re.DOTALL)
content = pattern.sub('const allTimeBestCalStreak = calculateBestCalorieStreak(metrics);', content)

# Wait, `CalorieDetailPage` currently uses `calorieStreak` from `useStreaks()`, which we can leave as is, or we can use the ones directly.
# The prompt says: "Calorie Detail: Delete all local streak code. Import calculateBestCalorieStreak()".
# Let's also check if it uses `calculateEarnedAwards`. In Calorie Detail, it maps `calAwards`. Let's see how `calAwards` is defined.
with open('src/features/nutrition/pages/CalorieDetailPage.tsx', 'w') as f:
    f.write(content)
