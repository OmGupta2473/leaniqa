/**
 * Onboarding v2 - pure calculation engine.
 *
 * Intentionally standalone: this module is the source of truth for onboarding
 * v2 and is NOT wired into any component, route or service yet (Phase 1B will
 * do that). The legacy `profileCalculations.ts` keeps powering the current
 * onboarding flow until then.
 *
 * Everything here is pure apart from `estimateTimeline`, which reads the
 * current date to project a calendar date.
 */

export type Sex = 'Male' | 'Female';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete';

export type GoalType = 'cut' | 'recomp' | 'bulk';

export interface OnboardingInput {
  sex: Sex;
  age: number; // years
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
}

export interface OnboardingPlan {
  bmr: number; // kcal
  maintenance: number; // kcal
  targetCalories: number; // kcal after goal adjustment
  proteinG: number;
  fatG: number;
  carbsG: number;
  bmi: number;
  goalType: GoalType; // the goal this plan was computed for
  goalAdjustmentPct: number; // e.g. -15 for cut, 0 for recomp, +10 for bulk
}

export interface GoalTimeline {
  weeksToGoal: number | null; // null when the goal is not weight-changing
  estimatedGoalDate: string | null; // ISO date string, e.g. "2026-04-15"
  estimatedGoalWeightKg: number | null;
}
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
};

export const GOAL_ADJUSTMENTS: Record<GoalType, number> = {
  cut: -0.15,
  recomp: 0,
  bulk: 0.10,
};

export const PROTEIN_G_PER_KG: Record<GoalType, number> = {
  cut: 2.0,
  recomp: 1.8,
  bulk: 1.6,
};

export const FAT_G_PER_KG: Record<GoalType, number> = {
  cut: 0.8,
  recomp: 0.9,
  bulk: 0.9,
};

/** Weekly weight-change assumption used by the simplified timeline estimate. */
const CUT_KG_PER_WEEK = 0.5;
const BULK_KG_PER_WEEK = 0.25;

/** Target weight change as a fraction of bodyweight, with an absolute cap. */
const CUT_DELTA_FRACTION = 0.08;
const CUT_DELTA_CAP_KG = 12;
const BULK_DELTA_FRACTION = 0.05;
const BULK_DELTA_CAP_KG = 8;

const MAX_AGE = 120;

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

function assertValidHeight(heightCm: number): void {
  if (!(heightCm > 0)) {
    throw new Error(`Invalid heightCm: ${heightCm}. Height must be greater than 0 cm.`);
  }
}

function assertValidWeight(weightKg: number): void {
  if (!(weightKg > 0)) {
    throw new Error(`Invalid weightKg: ${weightKg}. Weight must be greater than 0 kg.`);
  }
}

function assertValidAge(age: number): void {
  if (!(age > 0)) {
    throw new Error(`Invalid age: ${age}. Age must be greater than 0.`);
  }
  if (age > MAX_AGE) {
    throw new Error(`Invalid age: ${age}. Age must be ${MAX_AGE} or less.`);
  }
}

function assertValidInput(input: OnboardingInput): void {
  assertValidHeight(input.heightCm);
  assertValidWeight(input.weightKg);
  assertValidAge(input.age);
}
/** Mifflin-St Jeor BMR, rounded to the nearest kcal. */
export function calculateBMR(input: OnboardingInput): number {
  assertValidInput(input);
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age;
  return Math.round(input.sex === 'Female' ? base - 161 : base + 5);
}

/** BMR multiplied by the activity multiplier, rounded to the nearest kcal. */
export function calculateMaintenance(input: OnboardingInput): number {
  return Math.round(calculateBMR(input) * ACTIVITY_MULTIPLIERS[input.activity]);
}

/** BMI = weight / (height in metres)^2, rounded to two decimals. */
export function calculateBMI(heightCm: number, weightKg: number): number {
  assertValidHeight(heightCm);
  assertValidWeight(weightKg);
  const heightM = heightCm / 100;
  return roundTo(weightKg / (heightM * heightM), 2);
}

/**
 * Goal suggested from BMI alone. Used to pre-select an option on the goal
 * picker; the user can always override it.
 */
export function suggestGoal(bmi: number): GoalType {
  if (bmi < 20) return 'bulk';
  if (bmi < 25) return 'recomp';
  return 'cut';
}

/** Full calorie + macro plan for a given goal. */
export function calculatePlan(input: OnboardingInput, goal: GoalType): OnboardingPlan {
  const bmr = calculateBMR(input);
  const maintenance = Math.round(bmr * ACTIVITY_MULTIPLIERS[input.activity]);

  const targetCalories = Math.round(maintenance * (1 + GOAL_ADJUSTMENTS[goal]));
  const proteinG = Math.round(input.weightKg * PROTEIN_G_PER_KG[goal]);
  const fatG = Math.round(input.weightKg * FAT_G_PER_KG[goal]);
  const carbsG = Math.max(0, Math.round((targetCalories - proteinG * 4 - fatG * 9) / 4));

  return {
    bmr,
    maintenance,
    targetCalories,
    proteinG,
    fatG,
    carbsG,
    bmi: calculateBMI(input.heightCm, input.weightKg),
    goalType: goal,
    goalAdjustmentPct: Math.round(GOAL_ADJUSTMENTS[goal] * 100),
  };
}

/**
 * Timeline estimate for a weight-changing goal.
 *
 * Deliberately simplified for Phase 1A: a fixed 0.5 kg/week for a cut and
 * 0.25 kg/week for a bulk, targeting a fraction of current bodyweight (capped).
 * `recomp` is not weight-changing, so it has no timeline.
 */
export function estimateTimeline(
  input: OnboardingInput,
  goal: GoalType,
  plan: OnboardingPlan
): GoalTimeline {
  assertValidInput(input);

  // `plan` is part of the signature so callers can pass the plan they are
  // currently showing; the rate model below does not read it yet.
  void plan;

  if (goal === 'recomp') {
    return { weeksToGoal: null, estimatedGoalDate: null, estimatedGoalWeightKg: null };
  }

  const deltaKg = goal === 'cut'
    ? -Math.min(input.weightKg * CUT_DELTA_FRACTION, CUT_DELTA_CAP_KG)
    : Math.min(input.weightKg * BULK_DELTA_FRACTION, BULK_DELTA_CAP_KG);

  const weeklyRate = goal === 'cut' ? CUT_KG_PER_WEEK : BULK_KG_PER_WEEK;
  const weeksToGoal = Math.ceil(Math.abs(roundTo(deltaKg, 2)) / weeklyRate);

  const target = new Date();
  target.setDate(target.getDate() + weeksToGoal * 7);

  return {
    weeksToGoal,
    estimatedGoalDate: toLocalIsoDate(target),
    estimatedGoalWeightKg: roundTo(input.weightKg + deltaKg, 1),
  };
}

/** Local-time YYYY-MM-DD, so the projection never shifts a day across zones. */
function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
