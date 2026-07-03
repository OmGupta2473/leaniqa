export interface DailyData {
  targetCalories: number;
  actualCalories: number;
  targetProtein: number;
  actualProtein: number;
  hasWeightLogged: boolean;
  waterLiters: number;
  targetWaterLiters?: number;
}

export function calculateDailyScore(data: DailyData): number {
  const { targetCalories, actualCalories, targetProtein, actualProtein, hasWeightLogged, waterLiters } = data;
  const targetWater = data.targetWaterLiters || 3.0;

  // Calories = 40%
  // 100% if kcals = target. Scales down linearly to 0 if off by 100% or more.
  const calDiff = targetCalories > 0 ? Math.abs(actualCalories - targetCalories) / targetCalories : 0;
  const calRatio = actualCalories === 0 ? 0 : Math.max(0, 1 - calDiff);
  const calScore = calRatio * 40;

  // Protein = 30%
  const proRatio = targetProtein > 0 ? Math.min(actualProtein / targetProtein, 1) : 0;
  const proScore = actualProtein === 0 ? 0 : proRatio * 30;

  // Weight Tracking = 20%
  const weightScore = hasWeightLogged ? 20 : 0;

  // Water = 10%
  const waterRatio = targetWater > 0 ? Math.min(waterLiters / targetWater, 1) : 0;
  const waterScore = waterLiters === 0 ? 0 : waterRatio * 10;

  return Math.round(calScore + proScore + weightScore + waterScore);
}
