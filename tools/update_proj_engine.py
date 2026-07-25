import re

with open("src/shared/utils/projectionEngine.ts", "r") as f:
    content = f.read()

old_params = """export interface ProjectionParams {
  currentWeight: number;
  currentBf: number;
  targetBf: number;
  weeklyDeficitKcal: number;
  complianceScore: number;
}"""

new_params = """export interface ProjectionParams {
  currentWeight: number;
  currentBf: number;
  targetBf: number;
  weeklyDeficitKcal: number;
  complianceScore: number;
  actualPaceKgPerWeek?: number;
}"""

content = content.replace(old_params, new_params)

old_fatloss = """  // Real deficit adjusted by compliance (e.g. 80% compliance means you hit 80% of deficit on average)
  const effectiveDeficit = weeklyDeficitKcal * (complianceScore / 100);
  
  // 1 kg of fat is approx 7700 kcal
  const fatLossPerWeekKg = effectiveDeficit / 7700;"""

new_fatloss = """  // Real deficit adjusted by compliance (e.g. 80% compliance means you hit 80% of deficit on average)
  const effectiveDeficit = weeklyDeficitKcal * (complianceScore / 100);
  
  // 1 kg of fat is approx 7700 kcal
  // If actual pace is provided and is positive (losing weight), blend it or use it.
  // We'll prefer actual pace if it's losing weight, otherwise fallback to theoretical.
  const theoreticalFatLoss = effectiveDeficit / 7700;
  const fatLossPerWeekKg = (actualPaceKgPerWeek && actualPaceKgPerWeek > 0) ? actualPaceKgPerWeek : theoreticalFatLoss;"""

content = content.replace(old_fatloss, new_fatloss)

with open("src/shared/utils/projectionEngine.ts", "w") as f:
    f.write(content)
