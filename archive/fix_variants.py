with open("src/features/reports/pages/WeeklyReportPage.tsx", "r") as f:
    c = f.read()

c = c.replace("type: 'spring', stiffness: 250, damping: 25", "type: 'spring' as const, stiffness: 250, damping: 25")

with open("src/features/reports/pages/WeeklyReportPage.tsx", "w") as f:
    f.write(c)

