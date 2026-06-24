export interface ProjectionParams {
  currentWeight: number;
  currentBf: number;
  targetBf: number;
  weeklyDeficitKcal: number;
  complianceScore: number;
}

export interface ProjectionResult {
  bfTarget: number;
  date: Date;
  weeks: number;
  status: 'completed' | 'projected';
  estWeight: number;
}

export function calculateProjections({
  currentWeight,
  currentBf,
  targetBf,
  weeklyDeficitKcal,
  complianceScore,
}: ProjectionParams): ProjectionResult[] {
  const currentBfDec = currentBf / 100;
  const fatMass = currentWeight * currentBfDec;
  const leanMass = currentWeight - fatMass;

  // Real deficit adjusted by compliance (e.g. 80% compliance means you hit 80% of deficit on average)
  const effectiveDeficit = weeklyDeficitKcal * (complianceScore / 100);
  
  // 1 kg of fat is approx 7700 kcal
  const fatLossPerWeekKg = effectiveDeficit / 7700;
  
  if (fatLossPerWeekKg <= 0) {
    return []; // No projection if no deficit or 0 compliance
  }

  // Pre-defined milestones + custom target
  const rawTargets = [20, 18, 15, 12, targetBf];
  // Filter out duplicates and sort descending
  const targets = Array.from(new Set(rawTargets)).sort((a, b) => b - a);
  
  const results: ProjectionResult[] = [];
  const now = new Date();
  
  for (const t of targets) {
    if (t >= currentBf) {
      results.push({ bfTarget: t, date: now, weeks: 0, status: 'completed', estWeight: currentWeight });
      continue;
    }
    
    // Formula for required fat mass given constant lean mass
    const tDec = t / 100;
    const targetFatMass = (tDec * leanMass) / (1 - tDec);
    const fatToLose = fatMass - targetFatMass;
    const estWeight = leanMass + targetFatMass;
    
    if (fatToLose > 0) {
      const weeksToLose = fatToLose / fatLossPerWeekKg;
      const projectedDate = new Date();
      projectedDate.setDate(projectedDate.getDate() + Math.round(weeksToLose * 7));
      
      results.push({
        bfTarget: t,
        date: projectedDate,
        weeks: Math.ceil(weeksToLose),
        status: 'projected',
        estWeight
      });
    }
  }
  
  return results;
}
