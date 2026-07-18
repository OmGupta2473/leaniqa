import re

with open('src/features/goal/pages/GoalSetterPage.tsx', 'r') as f:
    content = f.read()

content = re.sub(r'text-\[18px\] font-bold text-white', 'text-[28px] font-bold tracking-tight text-white mb-2', content)
content = re.sub(r'text-\[13px\] text-\[rgba\(235,235,245,0\.5\)\] leading-relaxed', 'text-[15px] font-medium text-[rgba(235,235,245,0.6)] leading-relaxed', content)
content = re.sub(r'text-\[16px\] font-semibold', 'text-[20px] font-semibold tracking-tight', content)

with open('src/features/goal/pages/GoalSetterPage.tsx', 'w') as f:
    f.write(content)
