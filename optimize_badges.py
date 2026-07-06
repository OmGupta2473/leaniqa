import re

with open('src/features/reports/pages/WeeklyReportPage.tsx', 'r') as f:
    content = f.read()

old_recent = "const recentBadges = earnedAwards.filter(a => a.earned).slice(-6);"
new_recent = "const recentBadges = useMemo(() => earnedAwards.filter(a => a.earned).slice(-6), [earnedAwards]);"

content = content.replace(old_recent, new_recent)

with open('src/features/reports/pages/WeeklyReportPage.tsx', 'w') as f:
    f.write(content)
