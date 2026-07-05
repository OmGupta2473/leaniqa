import re

for filepath in ['src/features/nutrition/pages/CalorieDetailPage.tsx', 'src/features/nutrition/pages/ProteinDetailPage.tsx']:
    with open(filepath, 'r') as f:
        content = f.read()
    
    content = content.replace('import { useStreaks } from "@/shared/hooks/useStreaks";', '')
    
    if 'Calorie' in filepath:
        content = re.sub(r'const \{ calorieStreak, earnedAwards \} = useStreaks\(\);', 'const calorieStreak = calculateCurrentCalorieStreak(metrics);\n  const earnedAwards = calculateEarnedAwards(metrics);', content)
    else:
        content = content.replace('import { calculateBestProteinStreak } from "@/shared/utils/streaks";', 'import { calculateBestProteinStreak, calculateCurrentProteinStreak, calculateEarnedAwards } from "@/shared/utils/streaks";')
        content = re.sub(r'const \{ proteinStreak, earnedAwards \} = useStreaks\(\);', 'const proteinStreak = calculateCurrentProteinStreak(metrics);\n  const earnedAwards = calculateEarnedAwards(metrics);', content)

    with open(filepath, 'w') as f:
        f.write(content)
