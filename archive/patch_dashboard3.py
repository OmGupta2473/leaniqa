import re

with open("src/features/dashboard/pages/DashboardPage.tsx", "r") as f:
    c = f.read()

c = c.replace(
    "const fatTarget = Math.round((profile?.fat_target ?? onboardingData?.fatMid) || 0);",
    "const fatTarget = Math.round(onboardingData?.fatMid || 0);"
)

c = c.replace(
    "const carbsTarget = Math.round((profile?.carbs_target ?? onboardingData?.carbMid) || 0);",
    "const carbsTarget = Math.round(onboardingData?.carbMid || 0);"
)

with open("src/features/dashboard/pages/DashboardPage.tsx", "w") as f:
    f.write(c)
