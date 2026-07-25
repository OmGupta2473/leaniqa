import re

with open("src/features/reports/pages/WeeklyReportPage.tsx", "r") as f:
    content = f.read()

content = content.replace("background: '#000000'", "background: 'radial-gradient(circle at top, #111115 0%, #000000 100%)'")

with open("src/features/reports/pages/WeeklyReportPage.tsx", "w") as f:
    f.write(content)
