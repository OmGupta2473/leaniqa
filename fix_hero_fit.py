import re

with open('src/LandingPage.tsx', 'r') as f:
    content = f.read()

# 1. Adjust Hero section padding and alignment
content = content.replace(
    '<section className="pt-24 sm:pt-28 lg:pt-32 pb-16 sm:pb-24 px-6 relative z-10">',
    '<section className="pt-20 sm:pt-24 lg:pt-20 pb-12 sm:pb-16 lg:pb-12 px-6 relative z-10 lg:min-h-[calc(100vh-80px)] flex items-center">'
)

# Since we added flex and items-center to section, its direct child (div.max-w-7xl) should take full width
content = content.replace(
    '<div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-8">',
    '<div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-8">'
)

# 2. Adjust hero text size
content = content.replace(
    'className="text-4xl sm:text-5xl lg:text-7xl font-semibold tracking-tight leading-[1.1] lg:leading-[1.05] mb-4 sm:mb-6"',
    'className="text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-[4rem] font-semibold tracking-tight leading-[1.1] lg:leading-[1.05] mb-4 sm:mb-6"'
)

# 3. Compact InteractiveMealDemo paddings and margins for desktop
content = content.replace(
    'className="w-full max-w-[480px] mx-auto bg-[#0A0A0B] border border-zinc-800/50 rounded-[24px] sm:rounded-[32px] p-4 sm:p-6 shadow-2xl relative overflow-hidden group/demo"',
    'className="w-full max-w-[480px] lg:max-w-[420px] xl:max-w-[480px] mx-auto bg-[#0A0A0B] border border-zinc-800/50 rounded-[24px] sm:rounded-[32px] p-4 sm:p-5 shadow-2xl relative overflow-hidden group/demo"'
)

content = content.replace(
    'className="text-zinc-400 text-xs sm:text-sm mb-4 sm:mb-6 relative z-10"',
    'className="text-zinc-400 text-xs sm:text-sm mb-4 relative z-10"'
)

content = content.replace(
    'className="bg-[#111112]/80 backdrop-blur-md border border-zinc-800/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center justify-between mb-4 sm:mb-6 relative z-10 shadow-inner group/input cursor-text transition-all duration-300 hover:border-zinc-700 hover:bg-[#111112] hover:shadow-[0_4px_20px_-10px_rgba(255,255,255,0.05)]"',
    'className="bg-[#111112]/80 backdrop-blur-md border border-zinc-800/80 rounded-xl sm:rounded-2xl p-3 flex items-center justify-between mb-4 relative z-10 shadow-inner group/input cursor-text transition-all duration-300 hover:border-zinc-700 hover:bg-[#111112] hover:shadow-[0_4px_20px_-10px_rgba(255,255,255,0.05)]"'
)

# Success view layout tightening
content = content.replace(
    'className="text-zinc-100 font-medium text-[13px] sm:text-[15px] mb-4 sm:mb-5 border-b border-zinc-800/50 pb-3 sm:pb-4"',
    'className="text-zinc-100 font-medium text-[13px] sm:text-[14px] mb-3 sm:mb-4 border-b border-zinc-800/50 pb-3"'
)

content = content.replace(
    'className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 sm:mb-5"',
    'className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 sm:mb-4"'
)

with open('src/LandingPage.tsx', 'w') as f:
    f.write(content)
