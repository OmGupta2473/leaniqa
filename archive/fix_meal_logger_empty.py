import re

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "r") as f:
    content = f.read()

pattern = r'(<div className="text-\[13px\] font-semibold uppercase tracking-\[0\.06em\] text-\[rgba\(235,235,245,0\.5\)\] mb-\[10px\]">Meal Log</div>\s*)'
replacement = r'\1{meals.length === 0 && (\n          <div className="text-[14px] text-center text-[rgba(235,235,245,0.5)] mb-[16px] italic">No meals logged for this day.</div>\n        )}\n        '

content = re.sub(pattern, replacement, content)

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "w") as f:
    f.write(content)
