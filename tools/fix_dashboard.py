import re

with open('src/features/dashboard/pages/DashboardPage.tsx', 'r') as f:
    content = f.read()

# Make Dashboard Greeting bigger
content = re.sub(r'text-\[22px\] font-semibold tracking-tight', 'text-[28px] font-bold tracking-tight', content)

# Dashboard Date
content = re.sub(r'text-\[14px\] text-\[rgba\(235,235,245,0\.6\)\]', 'text-[15px] font-medium text-[rgba(235,235,245,0.6)] mb-2', content)

# Progress Rings Text
content = re.sub(r'text-\[34px\]', 'text-[40px] tracking-tight font-bold', content)

# Section Titles
content = re.sub(r'text-\[18px\] font-semibold tracking-tight text-white mb-4', 'text-[22px] font-semibold tracking-tight text-white mb-6', content)

# Small labels
content = re.sub(r'text-\[13px\] text-\[rgba\(235,235,245,0\.5\)\]', 'text-[14px] text-[rgba(235,235,245,0.6)]', content)

# Make streaks standout more
content = re.sub(r'text-\[24px\] font-bold text-white', 'text-[32px] font-bold text-white tracking-tight', content)

with open('src/features/dashboard/pages/DashboardPage.tsx', 'w') as f:
    f.write(content)

