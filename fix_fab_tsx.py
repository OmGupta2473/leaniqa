import re

with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'r') as f:
    content = f.read()

replacement = """      {/* ── SPACER TO PREVENT FAB OVERLAP ── */}
      <div style={{ height: '80px', flexShrink: 0 }} aria-hidden="true" />

      {/* ── FLOATING ADD BUTTON ── */}
      <div className="meal-fab-positioner">
        <div className="meal-fab-container">"""

content = content.replace(
"""      {/* ── SPACER TO PREVENT FAB OVERLAP ── */}
      <div style={{ height: '80px', flexShrink: 0 }} aria-hidden="true" />

      {/* ── FLOATING ADD BUTTON ── */}
      <div className="meal-fab-container">""", replacement)

content = content.replace(
"""          <Plus size={24} color="#0A0A0A" strokeWidth={2.5} />
        </button>
      </div>""",
"""          <Plus size={24} color="#0A0A0A" strokeWidth={2.5} />
        </button>
        </div>
      </div>""")

with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'w') as f:
    f.write(content)
