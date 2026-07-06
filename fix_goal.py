with open('src/features/goal/pages/GoalSetterPage.tsx', 'r') as f:
    content = f.read()

content = content.replace('overflow-x-auto pb-4 snap-x hide-scrollbar"', 'overflow-x-auto pb-4 snap-x hide-scrollbar touch-pan-x"')

with open('src/features/goal/pages/GoalSetterPage.tsx', 'w') as f:
    f.write(content)
