import re

with open('src/LandingPage.tsx', 'r') as f:
    content = f.read()

# 1. Remove the extra AI text
content = re.sub(
    r'<motion\.span[^>]*>\s*To hit your remaining.*?<\/motion\.span>',
    '',
    content,
    flags=re.DOTALL
)

# Also remove the mb-1 from the first span since it will be the only one
content = content.replace(
    'className="block text-zinc-300 mb-1"',
    'className="block text-zinc-300"'
)

# 2. Fix the padding in the Hero section
content = content.replace(
    '<section className="pt-12 sm:pt-16 lg:pt-16 pb-16 sm:pb-24 px-6 relative z-10">',
    '<section className="pt-24 sm:pt-28 lg:pt-32 pb-16 sm:pb-24 px-6 relative z-10">'
)

with open('src/LandingPage.tsx', 'w') as f:
    f.write(content)

