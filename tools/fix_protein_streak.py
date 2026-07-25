import re

with open("src/features/nutrition/pages/ProteinDetailPage.tsx", "r") as f:
    content = f.read()

streak_indicator_pattern = r'            <div\s*style=\{\{\s*fontSize: "var\(--font-sm\)",\s*color: "#D4FF00",\s*fontWeight: 600,\s*display: "flex",\s*alignItems: "center",\s*gap: "4px",\s*\}\}\s*>\s*⚡ \{currentStreak\} day streak\s*</div>'
content = re.sub(streak_indicator_pattern, '', content)

# Wait, let's just grep the exact style and remove it
content = re.sub(r'<div\s*style=\{\{\s*fontSize: "var\(--font-sm\)",\s*color: "[^"]*",\s*fontWeight: 600,\s*display: "flex",\s*alignItems: "center",\s*gap: "4px",\s*\}\}\s*>\s*⚡ \{currentStreak\} day streak\s*</div>', '', content, flags=re.DOTALL)

with open("src/features/nutrition/pages/ProteinDetailPage.tsx", "w") as f:
    f.write(content)
