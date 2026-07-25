import re

with open('src/index.css', 'r') as f:
    content = f.read()

# Find the start of /* ── Meal Logger FAB ── */
idx = content.find('/* ── Meal Logger FAB ── */')
if idx != -1:
    content = content[:idx]

replacement = """/* ── Meal Logger FAB ── */
.meal-fab-positioner {
  position: fixed;
  bottom: calc(env(safe-area-inset-bottom) + 16px);
  left: 0;
  width: 100vw;
  z-index: 50;
  pointer-events: none;
}

@media (min-width: 768px) {
  .meal-fab-positioner {
    left: 64px;
    width: calc(100vw - 64px);
  }
}

@media (min-width: 1200px) {
  .meal-fab-positioner {
    left: 240px;
    width: calc(100vw - 240px);
  }
}

.meal-fab-container {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  display: flex;
  justify-content: flex-end;
  padding-right: 24px;
}
"""

with open('src/index.css', 'w') as f:
    f.write(content + replacement)
