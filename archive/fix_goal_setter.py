import sys

with open('src/features/goal/pages/GoalSetterPage.tsx', 'r') as f:
    content = f.read()

content = content.replace("activeGoal?.currentBodyFatPct", "(activeGoal as any)?.currentBodyFatPct")
content = content.replace("activeGoal?.targetBodyFatPct", "(activeGoal as any)?.targetBodyFatPct")
content = content.replace("activeGoal?.chosenStrategyName", "(activeGoal as any)?.chosenStrategyName")
content = content.replace("activeGoal?.dailyCalorieGoal", "(activeGoal as any)?.dailyCalorieGoal")
content = content.replace("activeGoal?.dailyDeficit", "(activeGoal as any)?.dailyDeficit")
content = content.replace("activeGoal?.estimatedWeeks", "(activeGoal as any)?.estimatedWeeks")

# Also fix the mutation
content = content.replace("macros: strategyData.macros", "")
# Wait, I should make sure there's no trailing comma left when removing macros.
# Let's just remove it safely using regex.
import re
content = re.sub(r",\s*macros:\s*strategyData\.macros", "", content)

with open('src/features/goal/pages/GoalSetterPage.tsx', 'w') as f:
    f.write(content)
