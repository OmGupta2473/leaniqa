import re

with open("src/features/nutrition/pages/ProteinDetailPage.tsx", "r") as f:
    content = f.read()

# Replace header colors
target = """            <div
              style={{
                background: isTargetHit
                  ? "rgba(255,77,28,0.15)"
                  : "rgba(255,255,255,0.1)",
                color: isTargetHit ? "#FF4D1C" : "rgba(255,255,255,0.5)","""

replacement = """            <div
              style={{
                background: isTargetHit
                  ? "rgba(212,255,0,0.15)"
                  : "rgba(255,77,28,0.15)",
                color: isTargetHit ? "#D4FF00" : "#FF4D1C","""

content = content.replace(target, replacement)

with open("src/features/nutrition/pages/ProteinDetailPage.tsx", "w") as f:
    f.write(content)
