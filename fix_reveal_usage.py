with open('src/LandingPage.tsx', 'r') as f:
    content = f.read()

content = content.replace('<Reveal delay={i * 0.1} className="flex-1">', '<Reveal delay={i * 0.1}><div className="flex-1 h-full flex flex-col">')
content = content.replace('<Reveal delay={i * 0.1 + 0.1} className="flex-1">', '<Reveal delay={i * 0.1 + 0.1}><div className="flex-1 h-full flex flex-col">')
# Close the div after the inner content for both occurrences
# Let's do it manually using indices or split
