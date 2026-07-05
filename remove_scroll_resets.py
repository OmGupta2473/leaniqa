import os, re

files = [
    "src/features/nutrition/pages/ProteinDetailPage.tsx",
    "src/features/nutrition/pages/CalorieDetailPage.tsx",
    "src/features/awards/pages/AwardsPage.tsx",
    "src/features/transformation/pages/TransformationPage.tsx"
]

patterns = [
    r"\s*useEffect\(\(\) => \{\s*window\.scrollTo\(0,\s*0\);\s*const containers = document\.querySelectorAll\('\.overflow-y-auto'\);\s*containers\.forEach\(el => \{ \(el as HTMLElement\)\.scrollTop = 0; \}\);\s*\}, \[\]\);",
    r"\s*useEffect\(\(\) => \{\s*const el = document\.querySelector\('\.screen-container'\);\s*if \(el\) el\.scrollTop = 0;\s*\}, \[\]\);",
    r"\s*useEffect\(\(\) => \{\s*const el = document\.querySelector\('\.transformation-screen'\);\s*if \(el\) el\.scrollTop = 0;\s*\}, \[\]\);"
]

for filepath in files:
    with open(filepath, "r") as f:
        content = f.read()
    
    original = content
    for pattern in patterns:
        content = re.sub(pattern, "", content)
    
    if content != original:
        with open(filepath, "w") as f:
            f.write(content)
        print(f"Fixed {filepath}")
    else:
        print(f"No match in {filepath}")
