import sys

with open('src/features/goal/pages/GoalSetterPage.tsx', 'r') as f:
    lines = f.readlines()

def fix_line(line_num):
    idx = line_num - 1
    if "})()" in lines[idx]:
        lines[idx] = lines[idx].replace("})()", "})}")

fix_line(580)
fix_line(634)
fix_line(719)

with open('src/features/goal/pages/GoalSetterPage.tsx', 'w') as f:
    f.writelines(lines)
