import re

with open('src/features/profile/components/EditNutritionModal.tsx', 'r') as f:
    content = f.read()

old_payload = """      await profileService.upsertProfile({
        protein_target: targetPro,
        carbs_target: targetCarbs,
        fat_target: targetFat,
        water_target: targetWater
      });"""

new_payload = """      await profileService.upsertProfile({
        protein_target: targetPro,
        carbs_target: manualOverride ? targetCarbs : null,
        fat_target: manualOverride ? targetFat : null,
        water_target: targetWater
      });"""

content = content.replace(old_payload, new_payload)

with open('src/features/profile/components/EditNutritionModal.tsx', 'w') as f:
    f.write(content)

