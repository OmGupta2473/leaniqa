import re

with open('src/features/progress/pages/ProgressPage.tsx', 'r') as f:
    content = f.read()

# Make Title bigger
content = re.sub(r'text-\[16px\] font-semibold', 'text-[28px] font-bold tracking-tight mb-2', content)

# Section Titles
content = re.sub(r'text-\[18px\] font-semibold mb-4 text-white tracking-tight', 'text-[22px] font-semibold mb-6 text-white tracking-tight', content)
content = re.sub(r'text-\[15px\] font-semibold text-white tracking-tight', 'text-[18px] font-semibold text-white tracking-tight', content)

with open('src/features/progress/pages/ProgressPage.tsx', 'w') as f:
    f.write(content)

