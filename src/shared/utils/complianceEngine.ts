export interface DailyData {
  targetCalories: number;
  actualCalories: number;
  targetProtein: number;
  actualProtein: number;
  hasWeightLogged: boolean;
  targetFiber?: number;
  actualFiber?: number;
}

export function calculateDailyScore(data: DailyData): number {
  const { targetCalories, actualCalories, targetProtein, actualProtein, hasWeightLogged, targetFiber, actualFiber } = data;

  // With Fiber: Calories 40%, Protein 25%, Fiber 15%, Weight 20%
  // Without Fiber (fallback): Calories 50%, Protein 30%, Weight 20%
  const useFiber = targetFiber !== undefined && targetFiber > 0;
  const calWeight = useFiber ? 40 : 50;
  const proWeight = useFiber ? 25 : 30;
  const fibWeight = useFiber ? 15 : 0;
  const weightWeight = 20;

  const calDiff = targetCalories > 0 ? Math.abs(actualCalories - targetCalories) / targetCalories : 0;
  const calRatio = actualCalories === 0 ? 0 : Math.max(0, 1 - calDiff);
  const calScore = calRatio * calWeight;

  const proRatio = targetProtein > 0 ? Math.min(actualProtein / targetProtein, 1) : 0;
  const proScore = actualProtein === 0 ? 0 : proRatio * proWeight;

  let fibScore = 0;
  if (useFiber) {
    const fibRatio = Math.min((actualFiber || 0) / targetFiber, 1);
    fibScore = (actualFiber === 0) ? 0 : fibRatio * fibWeight;
  }

  const weightScore = hasWeightLogged ? weightWeight : 0;

  return Math.round(calScore + proScore + fibScore + weightScore);
}
