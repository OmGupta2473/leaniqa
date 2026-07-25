import re

files = [
    'src/features/awards/pages/AwardsPage.tsx',
    'src/features/goal/pages/GoalSetterPage.tsx',
    'src/features/profile/pages/ProfilePage.tsx'
]

for file in files:
    with open(file, 'r') as f:
        content = f.read()
    
    content = content.replace("), document.body)}", ", document.body)}")
    
    with open(file, 'w') as f:
        f.write(content)

print("Patched.")
