import re

with open("src/features/awards/pages/AwardsPage.tsx", "r") as f:
    content = f.read()

content = content.replace('selectedAward.category === "calories"\n                            ? "#D4FF00"\n                            : "#FF4D1C"', 'selectedAward.primaryColor || "#D4FF00"')

with open("src/features/awards/pages/AwardsPage.tsx", "w") as f:
    f.write(content)
