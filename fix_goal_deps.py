import sys

with open('src/features/goal/pages/GoalSetterPage.tsx', 'r') as f:
    content = f.read()

# Fix Step 1 Progression
content = content.replace(
    "}, [step, goal, onboardingData]);",
    "}, [step, goal, onboardingData?.chosenStrategyName]);"
)

with open('src/features/goal/pages/GoalSetterPage.tsx', 'w') as f:
    f.write(content)
