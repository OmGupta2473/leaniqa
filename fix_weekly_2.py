import re

with open("src/features/reports/pages/WeeklyReportPage.tsx", "r") as f:
    text = f.read()

text = text.replace("""<div style={{ fontSize: '32px', fontWeight: 800 }}>{todayActivity.caloriesConsumed}</div>""",
                    """<AnimatedNumber value={todayActivity.caloriesConsumed} style={{ fontSize: '32px', fontWeight: 800 }} />""")

with open("src/features/reports/pages/WeeklyReportPage.tsx", "w") as f:
    f.write(text)
