import re

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "r") as f:
    content = f.read()

old_str = """<div className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[rgba(235,235,245,0.5)]">Today's Progress</div>"""
new_str = """<div className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[rgba(235,235,245,0.5)]">Daily Summary</div>"""

content = content.replace(old_str, new_str)

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "w") as f:
    f.write(content)
