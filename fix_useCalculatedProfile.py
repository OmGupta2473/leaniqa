import re

with open('src/shared/hooks/useCalculatedProfile.ts', 'r') as f:
    content = f.read()

old_logic = """        let finalFat = profile.fat_target ?? macroOverrides.fat_target;
        let finalCarbs = profile.carbs_target ?? macroOverrides.carbs_target;
        let finalWater = profile.water_target ?? macroOverrides.water_target;

        if (finalFat == null && finalCarbs == null) {
          finalFat = Math.round((calcG.dailyCalorieGoal * fatPercentageMid) / 9);
          finalCarbs = Math.max(0, Math.round((calcG.dailyCalorieGoal - (profile.protein_target * 4) - (finalFat * 9)) / 4));
        } else if (finalFat != null && finalCarbs == null) {
          finalCarbs = Math.max(0, Math.round((calcG.dailyCalorieGoal - (profile.protein_target * 4) - (finalFat * 9)) / 4));
        } else if (finalFat == null && finalCarbs != null) {
          finalFat = Math.max(0, Math.round((calcG.dailyCalorieGoal - (profile.protein_target * 4) - (finalCarbs * 4)) / 9));
        }

        data.targetMacros = {
          protein: profile.protein_target,
          fat: finalFat,
          carbs: finalCarbs
        };
        data.manualOverrides = {
          carbs: finalCarbs != null,
          fat: finalFat != null,
          water: finalWater != null
        };
        if (finalWater) {
          data.waterLitres = finalWater;
        }"""

new_logic = """        const isCarbsOverridden = (profile.carbs_target != null) || (macroOverrides.carbs_target != null);
        const isFatOverridden = (profile.fat_target != null) || (macroOverrides.fat_target != null);
        const isWaterOverridden = (profile.water_target != null) || (macroOverrides.water_target != null);

        let finalFat = isFatOverridden ? (profile.fat_target ?? macroOverrides.fat_target) : null;
        let finalCarbs = isCarbsOverridden ? (profile.carbs_target ?? macroOverrides.carbs_target) : null;
        let finalWater = isWaterOverridden ? (profile.water_target ?? macroOverrides.water_target) : null;

        if (finalFat == null && finalCarbs == null) {
          finalFat = Math.round((calcG.dailyCalorieGoal * fatPercentageMid) / 9);
          finalCarbs = Math.max(0, Math.round((calcG.dailyCalorieGoal - (profile.protein_target * 4) - (finalFat * 9)) / 4));
        } else if (finalFat != null && finalCarbs == null) {
          finalCarbs = Math.max(0, Math.round((calcG.dailyCalorieGoal - (profile.protein_target * 4) - (finalFat * 9)) / 4));
        } else if (finalFat == null && finalCarbs != null) {
          finalFat = Math.max(0, Math.round((calcG.dailyCalorieGoal - (profile.protein_target * 4) - (finalCarbs * 4)) / 9));
        }

        data.targetMacros = {
          protein: profile.protein_target,
          fat: finalFat,
          carbs: finalCarbs
        };
        data.manualOverrides = {
          carbs: isCarbsOverridden,
          fat: isFatOverridden,
          water: isWaterOverridden
        };
        if (finalWater) {
          data.waterLitres = finalWater;
        }"""

content = content.replace(old_logic, new_logic)

with open('src/shared/hooks/useCalculatedProfile.ts', 'w') as f:
    f.write(content)

