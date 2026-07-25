with open('src/LandingPage.tsx', 'r') as f:
    content = f.read()

content = content.replace('ClipboardList', 'Check, ClipboardList')

with open('src/LandingPage.tsx', 'w') as f:
    f.write(content)
