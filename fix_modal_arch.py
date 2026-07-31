import re

with open('src/features/profile/components/EditNutritionModal.tsx', 'r') as f:
    content = f.read()

old_mutation = """  const mutation = useMutation({
    mutationFn: async () => {
      const targetCals = parseFloat(calories);
      const targetPro = parseFloat(protein);
      const targetCarbs = parseFloat(carbs);
      const targetFat = parseFloat(fat);
      const targetWater = parseFloat(water);
      
      if (isNaN(targetCals) || targetCals < 500 || targetCals > 10000) {
        throw new Error("Please enter a valid daily calorie goal (500-10000)");
      }
      if (isNaN(targetPro) || targetPro < 0 || targetPro > 500) {
        throw new Error("Please enter a valid protein goal (0-500g)");
      }
      if (isNaN(targetCarbs) || targetCarbs < 0 || targetCarbs > 1500) {
        throw new Error("Please enter a valid carbohydrate goal (0-1500g)");
      }
      if (isNaN(targetFat) || targetFat < 0 || targetFat > 500) {
        throw new Error("Please enter a valid fat goal (0-500g)");
      }
      if (isNaN(targetWater) || targetWater < 0 || targetWater > 20) {
        throw new Error("Please enter a valid water goal (0-20L)");
      }

      const tdee = calculatedData?.tdee || 0;
      const deficit = tdee - targetCals;

      await profileService.upsertProfile({
        protein_target: targetPro,
        carbs_target: manualOverride ? targetCarbs : null,
        fat_target: manualOverride ? targetFat : null,
        water_target: targetWater
      });

      await profileService.upsertGoal({
        deficit_kcal: deficit
      });
    },"""

new_mutation = """  const mutation = useMutation({
    mutationFn: async () => {
      const targetCals = parseFloat(calories);
      const targetPro = parseFloat(protein);
      const targetCarbs = parseFloat(carbs);
      const targetFat = parseFloat(fat);
      const targetWater = parseFloat(water);
      
      if (isNaN(targetCals) || targetCals < 500 || targetCals > 10000) {
        throw new Error("Please enter a valid daily calorie goal (500-10000)");
      }
      if (isNaN(targetPro) || targetPro < 0 || targetPro > 500) {
        throw new Error("Please enter a valid protein goal (0-500g)");
      }
      if (isNaN(targetCarbs) || targetCarbs < 0 || targetCarbs > 1500) {
        throw new Error("Please enter a valid carbohydrate goal (0-1500g)");
      }
      if (isNaN(targetFat) || targetFat < 0 || targetFat > 500) {
        throw new Error("Please enter a valid fat goal (0-500g)");
      }
      if (isNaN(targetWater) || targetWater < 0 || targetWater > 20) {
        throw new Error("Please enter a valid water goal (0-20L)");
      }

      const profilePayload: any = {};
      const goalPayload: any = {};

      // Only update if changed
      const originalCals = calculatedData?.dailyCalorieGoal;
      if (originalCals !== targetCals) {
        const tdee = calculatedData?.tdee || 0;
        goalPayload.deficit_kcal = tdee - targetCals;
      }

      const originalPro = calculatedData?.targetMacros?.protein || calculatedData?.proteinMid;
      if (originalPro !== targetPro) {
        profilePayload.protein_target = targetPro;
      }

      const originalCarbs = calculatedData?.targetMacros?.carbs;
      const originalFat = calculatedData?.targetMacros?.fat;
      
      // If manualOverride is active, and carbs/fat changed, save them
      if (manualOverride && (originalCarbs !== targetCarbs || originalFat !== targetFat)) {
        profilePayload.carbs_target = targetCarbs;
        profilePayload.fat_target = targetFat;
      }

      const originalWater = calculatedData?.waterLitres;
      if (originalWater !== targetWater) {
        profilePayload.water_target = targetWater;
      }

      if (Object.keys(profilePayload).length > 0) {
        await profileService.upsertProfile(profilePayload);
      }

      if (Object.keys(goalPayload).length > 0) {
        await profileService.upsertGoal(goalPayload);
      }
    },"""

content = content.replace(old_mutation, new_mutation)

with open('src/features/profile/components/EditNutritionModal.tsx', 'w') as f:
    f.write(content)

