import type { GoalType } from './onboardingMath';

export interface ProjectionParams {
  currentWeight: number;
  currentBf: number;
  targetBf: number;
  weeklyDeficitKcal: number;
  complianceScore: number;
  actualPaceKgPerWeek?: number;
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
  actualPaceKgPerWeek,
}: ProjectionParams): ProjectionResult[] {
  const currentBfDec = currentBf / 100;
  const fatMass = currentWeight * currentBfDec;
  const leanMass = currentWeight - fatMass;

  // Real deficit adjusted by compliance (e.g. 80% compliance means you hit 80% of deficit on average)
  const effectiveDeficit = weeklyDeficitKcal * (complianceScore / 100);
  
  // 1 kg of fat is approx 7700 kcal
  // If actual pace is provided and is positive (losing weight), blend it or use it.
  // We'll prefer actual pace if it's losing weight, otherwise fallback to theoretical.
  const theoreticalFatLoss = effectiveDeficit / 7700;
  const fatLossPerWeekKg = (actualPaceKgPerWeek && actualPaceKgPerWeek > 0) ? actualPaceKgPerWeek : theoreticalFatLoss;
  
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

// ---- Projected Progress: weight-timeline math (pure function, no I/O) ----

export interface ProjectionInput {
  weightKg: number;
  /** Null if the user has no explicit target weight. */
  targetWeightKg: number | null;
  goalType: GoalType;
  dailyCalorieTarget: number;
  maintenanceKcal: number;
}

export interface ProjectionPoint {
  weekNumber: number;
  estimatedWeightKg: number;
}

/**
 * Result of computeProjection().
 *
 * Note: named ComputeProjectionResult (not ProjectionResult) because this
 * module already exports a legacy ProjectionResult — the bf-milestone shape
 * consumed by calculateProjections() — and two interfaces with the same name
 * would declaration-merge, breaking that function's object literals.
 */
export interface ComputeProjectionResult {
  /** Signed. Negative for cut, positive for bulk, zero for recomp. */
  weeklyChangeKg: number;
  /** Milestone points for the chart: [0, 8, 12] weeks. */
  projectionPoints: ProjectionPoint[];
  /** Null when the goal has no weight target, or the target is on the
   *  opposite side of the current weight (e.g. cut goal but target is
   *  higher than current weight). */
  estimatedWeeksToGoal: number | null;
  /** ISO date string ("2026-12-14"). Null when estimatedWeeksToGoal is null. */
  estimatedGoalDate: string | null;
  /** One-line human-readable summary. */
  summary: string;
  /** True if the raw rate was capped to keep it realistic. */
  rateCapped: boolean;
}

// Formula sources:
//   - 7700 kcal/kg body fat: Wishnofsky 1958, Am J Clin Nutr
//   - 0.7% BW/week cut cap: Helms et al. 2014, JISSN
//   - 0.35% BW/week bulk cap: Slater & Phillips 2011, J Sports Sci
//   - Recomp at maintenance: Barakat et al. 2020, Strength Cond J
export function computeProjection(input: ProjectionInput): ComputeProjectionResult {
  const { weightKg, targetWeightKg, goalType, dailyCalorieTarget, maintenanceKcal } = input;

  // 1. Validate inputs.
  if (!(weightKg > 0)) {
    throw new Error(`computeProjection: weightKg must be > 0 (received ${weightKg})`);
  }
  if (!(maintenanceKcal > 0)) {
    throw new Error(`computeProjection: maintenanceKcal must be > 0 (received ${maintenanceKcal})`);
  }
  if (!(dailyCalorieTarget > 0)) {
    throw new Error(`computeProjection: dailyCalorieTarget must be > 0 (received ${dailyCalorieTarget})`);
  }
  if (goalType !== 'cut' && goalType !== 'recomp' && goalType !== 'bulk') {
    throw new Error(
      `computeProjection: goalType must be one of 'cut' | 'recomp' | 'bulk' (received ${String(goalType)})`
    );
  }

  // 2. Daily energy delta: negative for cut, positive for bulk, ~0 for recomp.
  const deltaKcal = dailyCalorieTarget - maintenanceKcal;

  // 3. Raw weekly change at 7700 kcal/kg (Wishnofsky 1958); signed with delta.
  const rawWeeklyKg = (deltaKcal * 7) / 7700;

  // 4. Realism caps: 0.7% BW/week cutting (Helms 2014),
  //    0.35% BW/week lean bulking (Slater & Phillips 2011).
  const cutCapKg = weightKg * 0.007;
  const bulkCapKg = weightKg * 0.0035;

  let weeklyChangeKg: number;
  let rateCapped = false;

  if (goalType === 'recomp') {
    // Recomp is a composition story, not a scale story — ignore deltaKcal
    // for the purposes of weight change (recomp at maintenance, Barakat 2020).
    weeklyChangeKg = 0;
    rateCapped = false;
  } else if (goalType === 'cut') {
    if (Math.abs(rawWeeklyKg) > cutCapKg) {
      weeklyChangeKg = -cutCapKg;
      rateCapped = true;
    } else {
      weeklyChangeKg = rawWeeklyKg;
    }
  } else if (rawWeeklyKg > bulkCapKg) {
    weeklyChangeKg = bulkCapKg;
    rateCapped = true;
  } else {
    weeklyChangeKg = rawWeeklyKg;
  }

  // 5. Milestone points at weeks [0, 8, 12]; never project below 30 kg.
  const projectionPoints: ProjectionPoint[] = [0, 8, 12].map((weekNumber) => {
    const projectedWeightKg = weightKg + weeklyChangeKg * weekNumber;
    return {
      weekNumber,
      estimatedWeightKg: Math.round(Math.max(projectedWeightKg, 30) * 10) / 10,
    };
  });

  // 6. Time-to-target: only when a target exists and points the same way as
  //    the goal. Recomp has no weight target by design.
  let estimatedWeeksToGoal: number | null = null;
  let estimatedGoalDate: string | null = null;

  if (goalType !== 'recomp' && targetWeightKg !== null && weeklyChangeKg !== 0) {
    const directionMatches =
      goalType === 'cut' ? targetWeightKg < weightKg : targetWeightKg > weightKg;

    if (directionMatches) {
      const weeksNeeded = Math.ceil(
        Math.abs(weightKg - targetWeightKg) / Math.abs(weeklyChangeKg)
      );
      // Sanity ceiling: past 2 years the linear model is meaningless -> null.
      if (weeksNeeded <= 104) {
        estimatedWeeksToGoal = weeksNeeded;
        const now = new Date();
        const todayUtcMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
        const goalUtcMs = todayUtcMs + weeksNeeded * 7 * 24 * 60 * 60 * 1000;
        estimatedGoalDate = new Date(goalUtcMs).toISOString().slice(0, 10);
      }
    }
  }

  // 7. One-line human summary.
  const formatKg = (kg: number): string => kg.toFixed(2);
  let summary: string;
  if (goalType === 'cut') {
    summary = `Lose ${formatKg(Math.abs(weeklyChangeKg))} kg/week at ${dailyCalorieTarget} kcal`;
  } else if (goalType === 'bulk') {
    summary = `Gain ${formatKg(weeklyChangeKg)} kg/week at ${dailyCalorieTarget} kcal`;
  } else {
    summary = `Maintain weight while recomposing at ${dailyCalorieTarget} kcal`;
  }

  return {
    weeklyChangeKg,
    projectionPoints,
    estimatedWeeksToGoal,
    estimatedGoalDate,
    summary,
    rateCapped,
  };
}
