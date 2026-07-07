import re

with open("src/features/profile/pages/ProfilePage.tsx", "r") as f:
    content = f.read()

# Remove the broken variables and openEdit
broken_pattern = r"  // Edit form state.*?// All the existing display values"
content = re.sub(broken_pattern, "// All the existing display values", content, flags=re.DOTALL)

with open("src/features/profile/pages/ProfilePage.tsx", "w") as f:
    f.write(content)
