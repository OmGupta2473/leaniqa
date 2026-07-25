import re
import os

# CalorieDetailPage
with open("src/features/nutrition/pages/CalorieDetailPage.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'import { calculateBestCalorieStreak, calculateEarnedAwards, calculateCurrentCalorieStreak } from "@/shared/utils/streaks";',
    'import { calculateBestDailyStreak, calculateEarnedAwards, calculateCurrentDailyStreak } from "@/shared/utils/streaks";'
)
content = content.replace('calculateCurrentCalorieStreak(metrics)', 'calculateCurrentDailyStreak(metrics)')
content = content.replace('calculateBestCalorieStreak(metrics)', 'calculateBestDailyStreak(metrics)')
content = content.replace('calorieStreak', 'currentStreak')
content = content.replace('allTimeBestCalStreak', 'allTimeBestStreak')
content = content.replace('Calorie Streak', 'Daily Streak')
content = content.replace('Calorie streak', 'Daily streak')

with open("src/features/nutrition/pages/CalorieDetailPage.tsx", "w") as f:
    f.write(content)

# ProteinDetailPage
with open("src/features/nutrition/pages/ProteinDetailPage.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'import { calculateBestProteinStreak, calculateCurrentProteinStreak, calculateEarnedAwards } from "@/shared/utils/streaks";',
    'import { calculateBestDailyStreak, calculateCurrentDailyStreak, calculateEarnedAwards } from "@/shared/utils/streaks";'
)
content = content.replace('calculateCurrentProteinStreak(metrics)', 'calculateCurrentDailyStreak(metrics)')
content = content.replace('calculateBestProteinStreak(metrics)', 'calculateBestDailyStreak(metrics)')
content = content.replace('proteinStreak', 'currentStreak')
content = content.replace('allTimeBestProStreak', 'allTimeBestStreak')
content = content.replace('Protein Streak', 'Daily Streak')
content = content.replace('Protein streak', 'Daily streak')

with open("src/features/nutrition/pages/ProteinDetailPage.tsx", "w") as f:
    f.write(content)
