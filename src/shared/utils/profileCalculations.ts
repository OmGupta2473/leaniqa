export function calculateMacros(weightKg: number, heightCm: number, age: number, gender: string, activityLevel: string) {
  if (import.meta.env.DEV) console.time('[PERF] calculateMacros');
  const maintBase = (weightKg * 10) + (heightCm * 6.25) - (age * 5) + (gender === 'Male' ? 5 : -161);
  const multipliers: Record<string, number> = { 
    'Sedentary': 1.2, 
    'Lightly Active': 1.375, 
    'Light': 1.375,
    'Moderately Active': 1.55, 
    'Moderate': 1.55,
    'Very Active': 1.725, 
    'Active': 1.725,
    'Athlete': 1.9 
  };
  const multiplier = multipliers[activityLevel] || multipliers['Lightly Active'];
  const tdee = Math.round((maintBase * multiplier) / 10) * 10;
  
  let proteinFactor = 1.8;
  let fatPercentageMid = 0.265;
  let fatPercentageMin = 0.25;
  let fatPercentageMax = 0.28;

  if (activityLevel === 'Sedentary' || activityLevel === 'Sedentary') {
    proteinFactor = 1.6;
    fatPercentageMid = 0.25;
    fatPercentageMin = 0.22;
    fatPercentageMax = 0.28;
  } else if (activityLevel === 'Lightly Active' || activityLevel === 'Light') {
    proteinFactor = 1.8;
    fatPercentageMid = 0.265;
    fatPercentageMin = 0.25;
    fatPercentageMax = 0.28;
  } else if (activityLevel === 'Moderately Active' || activityLevel === 'Moderate') {
    proteinFactor = 2.0;
    fatPercentageMid = 0.275;
    fatPercentageMin = 0.26;
    fatPercentageMax = 0.29;
  } else if (activityLevel === 'Very Active' || activityLevel === 'Active') {
    proteinFactor = 2.2;
    fatPercentageMid = 0.285;
    fatPercentageMin = 0.27;
    fatPercentageMax = 0.30;
  } else if (activityLevel === 'Athlete' || activityLevel === 'Very active') {
    proteinFactor = 2.4;
    fatPercentageMid = 0.30;
    fatPercentageMin = 0.28;
    fatPercentageMax = 0.32;
  }

  const proteinMid = Math.round(weightKg * proteinFactor);
  const proteinMin = Math.round(weightKg * (proteinFactor - 0.1));
  const proteinMax = Math.round(weightKg * (proteinFactor + 0.1));

  const fatMid = Math.round((tdee * fatPercentageMid) / 9);
  const fatMin = Math.round((tdee * fatPercentageMin) / 9);
  const fatMax = Math.round((tdee * fatPercentageMax) / 9);

  let carbKcal = tdee - (proteinMid * 4) - (fatMid * 9);
  if (isNaN(carbKcal) || !isFinite(carbKcal) || carbKcal < 0) {
    carbKcal = 0;
  }
  const carbMid = Math.max(0, Math.round(carbKcal / 4));
  const carbMin = Math.max(0, carbMid - 20);
  const carbMax = carbMid + 20;

  let fiberMin = Math.round((tdee / 1000) * 14);
  const fiberMax = fiberMin + 10;
  let water = weightKg * 0.033;
  if (activityLevel === 'Very Active' || activityLevel === 'Active' || activityLevel === 'Athlete' || activityLevel === 'Very active') {
    water += 0.5;
  }

  if (import.meta.env.DEV) console.timeEnd('[PERF] calculateMacros');
  return {
    tdee,
    proteinMin, proteinMid, proteinMax,
    fatMin, fatMid, fatMax,
    carbMin, carbMid, carbMax,
    fiberMin, fiberMax,
    waterLitres: water.toFixed(1)
  };
}

export function calculateBodyComposition(weightKg: number, currentBf: number, targetBf: number) {
  const fatMass = weightKg * (currentBf / 100);
  const leanMass = weightKg - fatMass;
  
  const targetFatMass = (leanMass * (targetBf / 100)) / (1 - (targetBf / 100));
  const targetWeightKg = leanMass + targetFatMass;
  
  const fatToLoseKg = Math.max(0, weightKg - targetWeightKg);

  return {
    fatMass,
    leanMass,
    targetFatMass,
    targetWeightKg,
    fatToLoseKg
  };
}

export function calculateGoalStats(tdee: number, weightKg: number, currentBf: number, targetBf: number, deficitKcal: number) {
  if (import.meta.env.DEV) console.time('[PERF] calculateGoalStats');
  
  const comp = calculateBodyComposition(weightKg, currentBf, targetBf);
  
  const dailyTarget = Math.round((tdee - deficitKcal) / 10) * 10;
  const weeklyRate = deficitKcal > 0 ? (deficitKcal * 7) / 7700 : 0;
  const weeks = deficitKcal > 0 && weeklyRate > 0 ? Math.round(comp.fatToLoseKg / weeklyRate) : 0;
  
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + weeks * 7);
  
  if (import.meta.env.DEV) console.timeEnd('[PERF] calculateGoalStats');
  return {
    fatToLoseKg: comp.fatToLoseKg.toFixed(1),
    targetWeightKg: comp.targetWeightKg.toFixed(1),
    dailyCalorieGoal: dailyTarget,
    estimatedWeeks: weeks,
    targetDateIso: targetDate.toISOString().split('T')[0],
    targetDateStr: deficitKcal > 0 ? targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Ongoing'
  };
}
