import re

with open('src/features/profile/pages/ProfilePage.tsx', 'r') as f:
    content = f.read()

content = re.sub(r'text-\[16px\] font-semibold', 'text-[28px] font-bold tracking-tight mb-2', content)
content = re.sub(r'text-\[18px\] font-bold', 'text-[24px] font-bold tracking-tight mb-2', content)

with open('src/features/profile/pages/ProfilePage.tsx', 'w') as f:
    f.write(content)
