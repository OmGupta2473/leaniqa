import sys

with open('src/features/goal/pages/GoalSetterPage.tsx', 'r') as f:
    content = f.read()

content = content.replace("activeGoal.estimatedWeeks", "(activeGoal as any).estimatedWeeks")

with open('src/features/goal/pages/GoalSetterPage.tsx', 'w') as f:
    f.write(content)
