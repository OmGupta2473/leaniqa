import sys

with open('src/features/goal/pages/GoalSetterPage.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "})}}" in line:
        lines[i] = line.replace("})}}", "})()}")
    elif "            })}" in line and i > 900 and i < 930:
        lines[i] = line.replace("})}", "})()")

with open('src/features/goal/pages/GoalSetterPage.tsx', 'w') as f:
    f.writelines(lines)
