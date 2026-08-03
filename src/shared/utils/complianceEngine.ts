export interface DailyData {
  targetCalories: number;
  actualCalories: number;
  targetProtein: number;
  actualProtein: number;
  hasWeightLogged: boolean;
}

export function calculateDailyScore(data: DailyData): number {
  const { targetCalories, actualCalories, targetProtein, actualProtein, hasWeightLogged } = data;

  // Calories = 50%
  // 100% if kcals = target. Scales down linearly to 0 if off by 100% or more.
  const calDiff = targetCalories > 0 ? Math.abs(actualCalories - targetCalories) / targetCalories : 0;
  const calRatio = actualCalories === 0 ? 0 : Math.max(0, 1 - calDiff);
  const calScore = calRatio * 50;

  // Protein = 30%
  const proRatio = targetProtein > 0 ? Math.min(actualProtein / targetProtein, 1) : 0;
  const proScore = actualProtein === 0 ? 0 : proRatio * 30;

  // Weight Tracking = 20%
  const weightScore = hasWeightLogged ? 20 : 0;

  return Math.round(calScore + proScore + weightScore);
}
