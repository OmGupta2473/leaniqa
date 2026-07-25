import re

with open("src/features/auth/pages/AuthPage.tsx", "r") as f:
    content = f.read()

# Change the left column container to items-center on desktop as well
# Current: "relative flex flex-col items-center lg:items-start lg:justify-center ..."
# New: "relative flex flex-col items-center justify-center p-6 sm:p-8 lg:p-12 xl:p-16 overflow-hidden lg:border-r border-white/5 lg:bg-[#0F0F11] w-full lg:w-1/2 flex-shrink-0"
content = content.replace(
    '<div className="relative flex flex-col items-center lg:items-start lg:justify-center p-6 sm:p-8 lg:p-12 xl:p-16 overflow-hidden lg:border-r border-white/5 lg:bg-[#0F0F11] w-full lg:w-1/2 flex-shrink-0">',
    '<div className="relative flex flex-col items-center justify-center p-6 sm:p-8 lg:p-12 xl:p-16 overflow-hidden lg:border-r border-white/5 lg:bg-[#0F0F11] w-full lg:w-1/2 flex-shrink-0">'
)

# And for the header/logo, it's absolute positioned on desktop, so centering the column won't affect it. Wait, the header is absolute on desktop:
# `lg:absolute lg:top-12 xl:top-16 lg:left-12 xl:left-16` - this is fine, it will stay in the top-left corner.

with open("src/features/auth/pages/AuthPage.tsx", "w") as f:
    f.write(content)
