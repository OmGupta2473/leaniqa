import re

with open("src/features/dashboard/pages/DashboardPage.tsx", "r") as f:
    content = f.read()

streak_row_pattern = r'      \{\/\* Streak chips \*\/.*?      </div>\n'
content = re.sub(streak_row_pattern, '', content, flags=re.DOTALL)

with open("src/features/dashboard/pages/DashboardPage.tsx", "w") as f:
    f.write(content)
