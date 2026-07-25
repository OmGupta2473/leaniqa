import re

with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'r') as f:
    content = f.read()

replacement = """      {/* ── SPACER TO PREVENT FAB OVERLAP ── */}
      <div style={{ height: '80px', flexShrink: 0 }} aria-hidden="true" />

      {/* ── FLOATING ADD BUTTON ── */}
      <div className="meal-fab-container">"""

content = re.sub(
    r'\s*\{\/\* ── FLOATING ADD BUTTON ── \*\/\}\s*\{\/\* Sticky add button — stays inside the app container, not the viewport \*\/\}\s*<div style=\{\{\s*position: \'sticky\',\s*bottom: \'calc\(env\(safe-area-inset-bottom\) \+ 16px\)\',\s*display: \'flex\',\s*justifyContent: \'flex-end\',\s*paddingRight: \'4px\',\s*pointerEvents: \'none\',\s*// Margin-top auto pushes it to bottom of scrollable content\s*marginTop: \'auto\',\s*\}\}>',
    replacement,
    content
)

with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'w') as f:
    f.write(content)
