import re

with open('src/LandingPage.tsx', 'r') as f:
    content = f.read()

content = content.replace("const pro = useDemoNumber(20.7, 1200, state === 'success', 1);", "const pro = useDemoNumber(20.73, 1200, state === 'success', 2);")
content = content.replace("const fat = useDemoNumber(13.8, 1200, state === 'success', 1);", "const fat = useDemoNumber(13.76, 1200, state === 'success', 2);")
content = content.replace("const carbs = useDemoNumber(74.8, 1200, state === 'success', 1);", "const carbs = useDemoNumber(74.77, 1200, state === 'success', 2);")
content = content.replace("Ai insight", "AI Insight") # Ensure it's correct

with open('src/LandingPage.tsx', 'w') as f:
    f.write(content)
print("Decimals updated")
