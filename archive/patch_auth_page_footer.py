import re

with open("src/features/auth/pages/AuthPage.tsx", "r") as f:
    content = f.read()

# Make footer stick to bottom on mobile
content = content.replace(
    '<div className="w-full flex justify-center lg:absolute lg:bottom-8 lg:left-0">',
    '<div className="w-full flex justify-center lg:absolute lg:bottom-8 lg:left-0 mt-auto lg:mt-0">'
)

with open("src/features/auth/pages/AuthPage.tsx", "w") as f:
    f.write(content)
