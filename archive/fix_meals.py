import re

with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'r') as f:
    content = f.read()

# Headers
content = re.sub(r'text-\[16px\] font-semibold', 'text-[28px] font-bold tracking-tight mb-2', content)

# Buttons inside
content = re.sub(r'rounded-\[20px\]', 'rounded-[24px]', content)
content = re.sub(r'text-\[14px\] font-medium', 'text-[15px] font-medium', content)

with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'w') as f:
    f.write(content)

