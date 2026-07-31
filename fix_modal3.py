import re

with open('src/features/profile/components/EditNutritionModal.tsx', 'r') as f:
    content = f.read()

old = """      const originalWater = calculatedData?.waterLitres;
      if (originalWater !== targetWater) {
        profilePayload.water_target = targetWater;
      }"""

new = """      // Always include water_target to ensure it saves
      profilePayload.water_target = targetWater;"""

content = content.replace(old, new)

with open('src/features/profile/components/EditNutritionModal.tsx', 'w') as f:
    f.write(content)

