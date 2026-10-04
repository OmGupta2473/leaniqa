import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateBMR,
  calculateMaintenance,
  calculateBMI,
  suggestGoal,
  calculatePlan,
  estimateTimeline,
  ACTIVITY_MULTIPLIERS,
  GOAL_ADJUSTMENTS,
  PROTEIN_G_PER_KG,
  FAT_G_PER_KG,
  type OnboardingInput,
  type GoalType,
} from './onboardingMath';

// 80 kg, 180 cm, 30 y/o sedentary male - reused by the plan tests.
const baseInput: OnboardingInput = {
  sex: 'Male',
  age: 30,
  heightCm: 180,
  weightKg: 80,
  activity: 'sedentary',
};

// Fixed "today" (2026-01-15, local noon) so the timeline dates are deterministic.
const FIXED_TODAY = new Date(2026, 0, 15, 12, 0, 0);

describe('onboardingMath', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_TODAY);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('T-1: calculateBMR for an 80kg/180cm/30yo male is 1780 kcal', () => {
    // 10*80 + 6.25*180 - 5*30 + 5
    expect(calculateBMR(baseInput)).toBe(1780);
  });

  it('T-2: calculateBMR for a 65kg/165cm/28yo female is 1380 kcal', () => {
    // 10*65 + 6.25*165 - 5*28 - 161 = 1380.25 -> 1380
    const input: OnboardingInput = {
      ...baseInput,
      sex: 'Female',
      weightKg: 65,
      heightCm: 165,
      age: 28,
    };
    expect(calculateBMR(input)).toBe(1380);
  });

  it('T-3: calculateBMI(180, 80) is 24.69', () => {
    expect(calculateBMI(180, 80)).toBe(24.69);
  });

  it('T-4: calculateBMI(165, 90) is 33.06', () => {
    expect(calculateBMI(165, 90)).toBe(33.06);
  });

  it('T-5: suggestGoal(18) is bulk', () => {
    expect(suggestGoal(18)).toBe('bulk');
  });

  it('T-6: suggestGoal(22) is recomp', () => {
    expect(suggestGoal(22)).toBe('recomp');
  });

  it('T-7: suggestGoal(28) is cut', () => {
    expect(suggestGoal(28)).toBe('cut');
  });

  it('T-8: suggestGoal(20) is recomp (threshold is inclusive on the upper end)', () => {
    expect(suggestGoal(20)).toBe('recomp');
  });

  it('T-9: suggestGoal(25) is cut (threshold is inclusive on the upper end)', () => {
    expect(suggestGoal(25)).toBe('cut');
  });
  it('T-10: calculatePlan for a cut returns the expected numbers', () => {
    const plan = calculatePlan(baseInput, 'cut');

    expect(plan.bmr).toBe(1780);
    expect(calculateMaintenance(baseInput)).toBe(2136); // 1780 * ACTIVITY_MULTIPLIERS.sedentary
    expect(plan.maintenance).toBe(2136);
    expect(plan.targetCalories).toBe(1816); // 2136 * (1 + GOAL_ADJUSTMENTS.cut)
    expect(plan.proteinG).toBe(Math.round(80 * PROTEIN_G_PER_KG.cut)); // 160
    expect(plan.proteinG).toBe(160);
    expect(plan.fatG).toBe(Math.round(80 * FAT_G_PER_KG.cut)); // 64
    expect(plan.fatG).toBe(64);
    expect(plan.carbsG).toBe(150); // (1816 - 640 - 576) / 4
    expect(plan.bmi).toBe(24.69);
    expect(plan.goalType).toBe('cut');
    expect(plan.goalAdjustmentPct).toBe(-15);
  });

  it('T-11: calculatePlan for a recomp keeps maintenance and shifts macros', () => {
    const plan = calculatePlan(baseInput, 'recomp');

    expect(plan.targetCalories).toBe(2136); // 2136 * (1 + GOAL_ADJUSTMENTS.recomp)
    expect(plan.proteinG).toBe(Math.round(80 * PROTEIN_G_PER_KG.recomp)); // 144
    expect(plan.fatG).toBe(Math.round(80 * FAT_G_PER_KG.recomp)); // 72
    expect(plan.carbsG).toBe(228); // (2136 - 576 - 648) / 4
    expect(plan.goalType).toBe('recomp');
    expect(plan.goalAdjustmentPct).toBe(0);
  });

  it('T-12: calculatePlan for a bulk raises target calories and lowers protein', () => {
    const plan = calculatePlan(baseInput, 'bulk');

    expect(plan.targetCalories).toBe(2350); // 2136 * (1 + GOAL_ADJUSTMENTS.bulk)
    expect(plan.proteinG).toBe(Math.round(80 * PROTEIN_G_PER_KG.bulk)); // 128
    expect(plan.fatG).toBe(Math.round(80 * FAT_G_PER_KG.bulk)); // 72
    expect(plan.carbsG).toBe(298); // (2350 - 512 - 648) / 4 = 297.5
    expect(plan.goalType).toBe('bulk');
    expect(plan.goalAdjustmentPct).toBe(10);
  });

  it('T-13: macros reconcile with target calories within 5 kcal for every goal', () => {
    const goals: GoalType[] = ['cut', 'recomp', 'bulk'];

    for (const goal of goals) {
      const plan = calculatePlan(baseInput, goal);
      const macroKcal = plan.proteinG * 4 + plan.fatG * 9 + plan.carbsG * 4;

      expect(plan.carbsG).toBeGreaterThanOrEqual(0);
      expect(Math.abs(macroKcal - plan.targetCalories)).toBeLessThanOrEqual(5);
    }
  });
  it('T-14: estimateTimeline for a cut at 80kg projects -6.4kg in 13 weeks', () => {
    const plan = calculatePlan(baseInput, 'cut');
    const timeline = estimateTimeline(baseInput, 'cut', plan);

    expect(timeline.weeksToGoal).toBe(13); // ceil(6.4 / 0.5)
    expect(timeline.estimatedGoalWeightKg).toBe(73.6);
    // 2026-01-15 + 13 weeks (91 days)
    expect(timeline.estimatedGoalDate).toBe('2026-04-16');
  });

  it('T-15: estimateTimeline for a bulk at 60kg projects +3.0kg in 12 weeks', () => {
    const input: OnboardingInput = { ...baseInput, weightKg: 60 };
    const plan = calculatePlan(input, 'bulk');
    const timeline = estimateTimeline(input, 'bulk', plan);

    expect(timeline.weeksToGoal).toBe(12); // ceil(3.0 / 0.25)
    expect(timeline.estimatedGoalWeightKg).toBe(63.0);
    // 2026-01-15 + 12 weeks (84 days)
    expect(timeline.estimatedGoalDate).toBe('2026-04-09');
  });

  it('T-16: estimateTimeline for a recomp returns nulls', () => {
    const plan = calculatePlan(baseInput, 'recomp');
    const timeline = estimateTimeline(baseInput, 'recomp', plan);

    expect(timeline.weeksToGoal).toBeNull();
    expect(timeline.estimatedGoalDate).toBeNull();
    expect(timeline.estimatedGoalWeightKg).toBeNull();
  });
  it('T-17: throws when heightCm is not positive', () => {
    expect(() => calculateBMR({ ...baseInput, heightCm: 0 })).toThrow(/height/i);
    expect(() => calculatePlan({ ...baseInput, heightCm: 0 }, 'cut')).toThrow(/height/i);
    expect(() => calculateBMI(0, 80)).toThrow(/height/i);
  });

  it('T-18: throws when age is out of range', () => {
    expect(() => calculateBMR({ ...baseInput, age: 150 })).toThrow(/age/i);
    expect(() => calculateMaintenance({ ...baseInput, age: 150 })).toThrow(/age/i);
    expect(() =>
      estimateTimeline({ ...baseInput, age: 150 }, 'cut', calculatePlan(baseInput, 'cut'))
    ).toThrow(/age/i);
  });

  it('T-19: throws when weightKg is not positive', () => {
    expect(() => calculateBMR({ ...baseInput, weightKg: -5 })).toThrow(/weight/i);
    expect(() => calculatePlan({ ...baseInput, weightKg: -5 }, 'cut')).toThrow(/weight/i);
    expect(() => calculateBMI(180, -5)).toThrow(/weight/i);
  });
});
