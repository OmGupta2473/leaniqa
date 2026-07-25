import re

with open("src/features/dashboard/pages/DashboardPage.tsx", "r") as f:
    content = f.read()

pattern = r'            <div style=\{\{ fontSize: \'var\(--font-xs\)\', color: \'rgba\(235,235,245,0\.5\)\', textTransform: \'uppercase\', fontWeight: 600 \}\}>\s*daily streak\s*</div>\s*</div>\s*</div>\s*</div>\s*'
content = re.sub(pattern, '', content)

with open("src/features/dashboard/pages/DashboardPage.tsx", "w") as f:
    f.write(content)
