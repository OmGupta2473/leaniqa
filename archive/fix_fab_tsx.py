import re

with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'r') as f:
    content = f.read()

# Replace the opening <div className="screen-container screen-enter" ...>
content = content.replace(
    '<div className="screen-container screen-enter" style={{ display: \'flex\', flexDirection: \'column\' }}>',
    '<>\\n      <div className="screen-container screen-enter" style={{ display: \'flex\', flexDirection: \'column\' }}>'
)

# Now, we need to close this div right before the FAB starts, and add screen-enter to the FAB to animate it too.
fab_start = """      {/* ── FLOATING ADD BUTTON ── */}
      <div className="meal-fab-positioner">"""

new_fab_start = """      </div>
      {/* ── FLOATING ADD BUTTON ── */}
      <div className="meal-fab-positioner screen-enter">"""

content = content.replace(fab_start, new_fab_start)

# Change the very last </div> to </Fragment>
# Wait, we can just replace the last </div> with </>
content = re.sub(r'    </div>\n  \);\n}\n?$', '    </>\n  );\n}\n', content)


with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'w') as f:
    f.write(content)
