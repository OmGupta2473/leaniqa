import re

with open('src/LandingPage.tsx', 'r') as f:
    content = f.read()

with open('new_demo.tsx', 'r') as f:
    new_demo = f.read()

# Make sure RotateCcw is imported
if 'RotateCcw' not in content:
    content = content.replace('} from "lucide-react"', ', RotateCcw} from "lucide-react"')

# Replace InteractiveMealDemo
pattern = re.compile(r'function InteractiveMealDemo\(\) \{.*?\/\* End InteractiveMealDemo \*\/', re.DOTALL)
content = pattern.sub(new_demo + '\n/* End InteractiveMealDemo */', content)

# Fallback if no End InteractiveMealDemo was found (maybe I deleted it or it wasn't there)
if 'function InteractiveMealDemo()' in content and new_demo not in content:
    print("Could not match regex exactly. Using simple split.")
    parts = content.split('function InteractiveMealDemo() {')
    if len(parts) > 1:
        before = parts[0]
        # find the end of the function by matching brackets...
        # actually, I can just find `function GridCard` and replace everything in between.
        if 'function GridCard' in parts[1]:
            after = 'function GridCard' + parts[1].split('function GridCard')[1]
            content = before + new_demo + '\n' + after

with open('src/LandingPage.tsx', 'w') as f:
    f.write(content)

print("Replaced successfully")
