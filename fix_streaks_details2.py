import re
import os

files_to_fix = [
    "src/features/nutrition/pages/CalorieDetailPage.tsx",
    "src/features/nutrition/pages/ProteinDetailPage.tsx"
]

for filepath in files_to_fix:
    with open(filepath, "r") as f:
        content = f.read()
    
    # Remove the `🔥 {currentStreak} day streak` in CalorieDetailPage or similar in ProteinDetailPage
    if "CalorieDetailPage.tsx" in filepath:
        streak_indicator_pattern = r'            <div\s*style=\{\{\s*fontSize: "var\(--font-sm\)",\s*color: "#D4FF00",\s*fontWeight: 600,\s*display: "flex",\s*alignItems: "center",\s*gap: "4px",\s*\}\}\s*>\s*🔥 \{currentStreak\} day streak\s*</div>'
        content = re.sub(streak_indicator_pattern, '', content)
    else:
        streak_indicator_pattern = r'            <div\s*style=\{\{\s*fontSize: "var\(--font-sm\)",\s*color: "#FF4D1C",\s*fontWeight: 600,\s*display: "flex",\s*alignItems: "center",\s*gap: "4px",\s*\}\}\s*>\s*💪 \{currentStreak\} day streak\s*</div>'
        content = re.sub(streak_indicator_pattern, '', content)
    
    # Remove Awards Progress section
    awards_progress_pattern = r'        \{\/\* Awards Progress \*\/.*?\}\)\}\s*</div>'
    content = re.sub(awards_progress_pattern, '', content, flags=re.DOTALL)
    
    # Clean up unused imports/vars
    content = re.sub(r'\s*const earnedAwards = calculateEarnedAwards\(metrics\);\s*', '\n', content)
    content = re.sub(r'import { calculateEarnedAwards } from "@/shared/utils/streaks";', '', content)
    content = re.sub(r'import \{ calculateEarnedAwards,\s*\} from "@/shared/utils/streaks";', '', content)
    
    # For CalorieDetailPage: `const calAwards = earnedAwards.filter((a) => a.category === "calories");`
    content = re.sub(r'\s*const calAwards = earnedAwards\.filter\(\(a\) => a\.category === "calories"\);\s*', '\n', content)
    # For ProteinDetailPage: `const proAwards = earnedAwards.filter((a) => a.category === "protein");`
    content = re.sub(r'\s*const proAwards = earnedAwards\.filter\(\(a\) => a\.category === "protein"\);\s*', '\n', content)

    with open(filepath, "w") as f:
        f.write(content)
