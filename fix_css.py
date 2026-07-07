import re

with open("src/index.css", "r") as f:
    content = f.read()

fab_css_pattern = r'/\* ── Meal Logger FAB ── \*/.*?(?=\n@media \(prefers-reduced-motion)'

new_fab_css = """/* ── Meal Logger FAB ── */
.meal-fab-positioner {
  position: fixed;
  /* 60px bottom nav + 20px spacing */
  bottom: calc(env(safe-area-inset-bottom) + 80px);
  left: 0;
  width: 100vw;
  z-index: 50;
  pointer-events: none;
}

@media (min-width: 768px) {
  .meal-fab-positioner {
    /* No bottom nav on desktop/tablet, reduce bottom spacing */
    bottom: calc(env(safe-area-inset-bottom) + 32px);
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
  justify-content: center;
}"""

content = re.sub(fab_css_pattern, new_fab_css, content, flags=re.DOTALL)

with open("src/index.css", "w") as f:
    f.write(content)

