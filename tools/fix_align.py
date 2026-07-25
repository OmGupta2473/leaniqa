import re

with open('src/LandingPage.tsx', 'r') as f:
    content = f.read()

# Fix WHY LEANIQA section
content = content.replace(
    '<div className="mb-10 md:mb-16 max-w-3xl mx-auto text-center md:text-left">',
    '<div className="mb-10 md:mb-16 max-w-3xl mx-auto text-center">'
)
content = content.replace(
    '<div className="flex items-center justify-center md:justify-start gap-2 text-xs font-mono text-[#D4FF00] uppercase tracking-widest mb-4">',
    '<div className="flex items-center justify-center gap-2 text-xs font-mono text-[#D4FF00] uppercase tracking-widest mb-4">'
)
content = content.replace(
    '<p className="text-zinc-400 text-base sm:text-lg lg:text-xl max-w-2xl leading-relaxed mx-auto md:mx-0">',
    '<p className="text-zinc-400 text-base sm:text-lg lg:text-xl max-w-2xl leading-relaxed mx-auto">'
)

# Fix Intelligence that drives consistency section
content = content.replace(
    '<div className="mb-12 sm:mb-16 max-w-2xl">',
    '<div className="mb-12 sm:mb-16 max-w-3xl mx-auto text-center">'
)

with open('src/LandingPage.tsx', 'w') as f:
    f.write(content)
print("Updated successfully")
