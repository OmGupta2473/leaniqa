import re

with open("src/index.css", "r") as f:
    content = f.read()

# We want to replace everything from .meal-fab-container { up to @media (prefers-reduced-motion
pattern = r'\.meal-fab-container \{.*?(?=\n@media \(prefers-reduced-motion)'

replacement = """.meal-fab-container {
  width: 100%;
  display: flex;
  justify-content: center; /* Center on mobile */
  pointer-events: none;
}

@media (min-width: 768px) {
  .meal-fab-container {
    justify-content: flex-end; /* Right align on tablet/desktop */
    padding-right: 28px;
  }
}

@media (min-width: 1200px) {
  .meal-fab-container {
    max-width: 720px;
    margin: 0 auto;
    padding-right: 32px;
  }
}
"""

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open("src/index.css", "w") as f:
    f.write(content)
