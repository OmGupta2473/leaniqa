import re
import os

files_to_fix = [
    "src/features/nutrition/pages/CalorieDetailPage.tsx",
    "src/features/nutrition/pages/ProteinDetailPage.tsx"
]

for filepath in files_to_fix:
    with open(filepath, "r") as f:
        content = f.read()
    
    # Remove the Streak Stats UI
    streak_stats_pattern = r'        \{\/\* Streak Stats \*\/.*?</div>\s*\{\/\* Bar chart section \*\/\}'
    content = re.sub(streak_stats_pattern, '        {/* Bar chart section */}', content, flags=re.DOTALL)
    
    # Remove unused variables if any
    content = re.sub(r'\s*const currentStreak = calculateCurrentDailyStreak\(metrics\);\s*', '\n', content)
    content = re.sub(r'\s*const allTimeBestStreak = calculateBestDailyStreak\(metrics\);\s*', '\n', content)
    
    # Also we can remove it from imports, but we can rely on lint to show if unused. Actually I'll just remove them explicitly:
    content = re.sub(r'calculateBestDailyStreak,\s*', '', content)
    content = re.sub(r'calculateCurrentDailyStreak,\s*', '', content)
    
    with open(filepath, "w") as f:
        f.write(content)
