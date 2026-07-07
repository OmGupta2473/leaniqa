import re

with open("src/features/reports/pages/WeeklyReportPage.tsx", "r") as f:
    content = f.read()

content = content.replace("type: 'spring',", "type: 'spring' as const,")

with open("src/features/reports/pages/WeeklyReportPage.tsx", "w") as f:
    f.write(content)
