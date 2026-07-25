import re

with open("src/features/awards/pages/AwardsPage.tsx", "r") as f:
    content = f.read()

content = content.replace('{calorieStreak}', '{currentStreak}')
content = content.replace('{proteinStreak}', '{currentStreak}')
content = content.replace('calAwards.map', 'dailyAwards.map')
content = content.replace('proAwards.map', 'dailyAwards.map')
content = content.replace('selectedAward.category === "calories" ? calorieStreak : proteinStreak', 'currentStreak')
content = content.replace('selectedAward.category === "calories"\n                      ? calorieStreak\n                      : proteinStreak', 'currentStreak')

with open("src/features/awards/pages/AwardsPage.tsx", "w") as f:
    f.write(content)
