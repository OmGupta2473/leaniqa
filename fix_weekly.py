import re

with open('src/features/reports/pages/WeeklyReportPage.tsx', 'r') as f:
    content = f.read()

# Make Hero Score bigger (it is currently text-[36px] font-bold ... avgCompliance%)
content = re.sub(r'text-\[40px\] font-bold text-\[\#D4FF00\] tracking-tighter leading-none mb-1', 'text-[56px] font-bold text-white tracking-[-0.04em] leading-none mb-2', content)

# Change "Avg Compliance" label in hero
content = re.sub(r'text-\[11px\] uppercase tracking-\[0\.05em\] font-medium text-\[rgba\(255,255,255,0\.5\)\] mb-2', 'text-[13px] font-semibold tracking-widest text-[rgba(235,235,245,0.6)] uppercase mb-3', content)

# "Avg Calories" / "Avg Protein" values
content = re.sub(r'text-\[20px\] font-bold text-white tracking-tight', 'text-[24px] font-bold text-white tracking-tight', content)

# Section Titles
content = re.sub(r'text-\[12px\] font-bold text-white tracking-widest uppercase', 'text-[15px] font-semibold text-white tracking-widest uppercase', content)
content = re.sub(r'text-\[15px\] font-semibold text-white tracking-tight', 'text-[20px] font-semibold text-white tracking-tight', content)

# Coach Summary Body (aiCoachData.summaryShort and summaryLong)
# Wrap them in a better text class
content = content.replace('text-[14px] text-[rgba(255,255,255,0.8)] leading-relaxed', 'text-[16px] text-white leading-[1.6] font-medium tracking-tight')
content = content.replace('text-[14px] text-[rgba(255,255,255,0.7)] leading-relaxed', 'text-[15px] text-[rgba(235,235,245,0.8)] leading-[1.6]')

# Recommendation titles
content = re.sub(r'text-\[15px\] font-semibold text-white tracking-tight', 'text-[18px] font-semibold text-white tracking-tight', content)

# Make badges in recommendations better
content = re.sub(r'text-\[11px\] font-semibold tracking-wide', 'text-[12px] font-semibold tracking-wide', content)

with open('src/features/reports/pages/WeeklyReportPage.tsx', 'w') as f:
    f.write(content)

