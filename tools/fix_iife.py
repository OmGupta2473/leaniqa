import sys

with open('src/features/goal/pages/GoalSetterPage.tsx', 'r') as f:
    content = f.read()

content = content.replace("            })}", "            })()}")

with open('src/features/goal/pages/GoalSetterPage.tsx', 'w') as f:
    f.write(content)
