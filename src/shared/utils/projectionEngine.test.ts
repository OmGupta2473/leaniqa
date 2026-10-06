import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { computeProjection, type ProjectionInput } from './projectionEngine';

// Fixed "today" (2026-10-06, UTC noon) so estimatedGoalDate is deterministic.
const FIXED_NOW = new Date('2026-10-06T12:00:00Z');

// 78 kg, cutting at 1709 kcal (427 kcal deficit) - reused by most tests.
const baseInput: ProjectionInput = {
  weightKg: 78,
  targetWeightKg: null,
  goalType: 'cut',
  dailyCalorieTarget: 1709,
  maintenanceKcal: 2136,
};

describe('projectionEngine.computeProjection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('T-1: cut under the cap yields -0.388 kg/week, week-12 point 73.3 kg', () => {
    const result = computeProjection({ ...baseInput });
    expect(result.rateCapped).toBe(false);
    expect(result.weeklyChangeKg).toBeCloseTo(-0.388, 3); // 427 * 7 / 7700
    expect(result.projectionPoints[2].estimatedWeightKg).toBe(73.3); // 78 - 0.38818*12, rounded
    expect(result.summary).toContain('Lose 0.39 kg/week');
  });

  it('T-2: cut over the 0.7% BW cap is capped at -0.42 kg/week', () => {
    const result = computeProjection({
      ...baseInput,
      weightKg: 60,
      maintenanceKcal: 2000,
      dailyCalorieTarget: 1300,
    });
    // raw = 700 * 7 / 7700 = 0.636 > 0.007 * 60 = 0.42
    expect(result.rateCapped).toBe(true);
    expect(result.weeklyChangeKg).toBe(-0.42);
  });

  it('T-3: bulk under the cap yields +0.155 kg/week', () => {
    const result = computeProjection({
      ...baseInput,
      goalType: 'bulk',
      dailyCalorieTarget: 2307,
    });
    expect(result.rateCapped).toBe(false);
    expect(result.weeklyChangeKg).toBeCloseTo(0.155, 3); // 171 * 7 / 7700
    expect(result.summary).toContain('Gain 0.16 kg/week');
  });

  it('T-4: bulk over the 0.35% BW cap is capped at +0.21 kg/week', () => {
    const result = computeProjection({
      ...baseInput,
      weightKg: 60,
      goalType: 'bulk',
      maintenanceKcal: 2000,
      dailyCalorieTarget: 2500,
    });
    // raw = 500 * 7 / 7700 = 0.455 > 0.0035 * 60 = 0.21
    expect(result.rateCapped).toBe(true);
    expect(result.weeklyChangeKg).toBe(0.21);
  });

  it('T-5: recomp holds weight flat and summarizes as Maintain weight', () => {
    const result = computeProjection({
      ...baseInput,
      goalType: 'recomp',
      maintenanceKcal: 2136,
      dailyCalorieTarget: 2136,
    });
    expect(result.weeklyChangeKg).toBe(0);
    expect(result.rateCapped).toBe(false);
    expect(result.projectionPoints[0].estimatedWeightKg).toBe(78); // unchanged at week 0
    expect(result.projectionPoints[2].estimatedWeightKg).toBe(78); // unchanged at week 12
    expect(result.summary).toContain('Maintain weight');
  });

  it('T-6: cut to a reachable target gives 16 weeks and goal date 2027-01-26', () => {
    const result = computeProjection({ ...baseInput, targetWeightKg: 72 });
    expect(result.estimatedWeeksToGoal).toBe(16); // ceil(6 / 0.3881818...)
    expect(result.estimatedGoalDate).toBe('2027-01-26'); // 2026-10-06 + 16*7 = 112 days
  });

  it('T-7: cut with target above current weight returns null timeline', () => {
    const result = computeProjection({ ...baseInput, targetWeightKg: 82 });
    expect(result.estimatedWeeksToGoal).toBeNull();
    expect(result.estimatedGoalDate).toBeNull();
  });

  it('T-8: bulk with target below current weight returns null timeline', () => {
    const result = computeProjection({
      ...baseInput,
      goalType: 'bulk',
      dailyCalorieTarget: 2307,
      targetWeightKg: 74,
    });
    expect(result.estimatedWeeksToGoal).toBeNull();
    expect(result.estimatedGoalDate).toBeNull();
  });

  it('T-9: recomp never reports a weight-target timeline', () => {
    const result = computeProjection({
      ...baseInput,
      goalType: 'recomp',
      dailyCalorieTarget: 2136,
      targetWeightKg: 75,
    });
    expect(result.estimatedWeeksToGoal).toBeNull();
    expect(result.estimatedGoalDate).toBeNull();
  });

  it('T-10: target needing <104 weeks stays (78 -> 40kg = 91 weeks)', () => {
    const result = computeProjection({
      ...baseInput,
      dailyCalorieTarget: 1674, // 462 kcal deficit -> exactly 0.42 kg/week
      targetWeightKg: 40,
    });
    expect(result.weeklyChangeKg).toBe(-0.42);
    expect(result.estimatedWeeksToGoal).toBe(91); // ceil(38 / 0.42) = 90.48 -> 91
  });

  it('T-11: target needing >104 weeks returns null (78 -> 30kg = 115 weeks)', () => {
    const result = computeProjection({
      ...baseInput,
      dailyCalorieTarget: 1674,
      targetWeightKg: 30,
    });
    expect(result.estimatedWeeksToGoal).toBeNull(); // ceil(48 / 0.42) = 115 > 104
    expect(result.estimatedGoalDate).toBeNull();
  });

  it('T-12: throws when weightKg is not positive', () => {
    expect(() => computeProjection({ ...baseInput, weightKg: 0 })).toThrow(/weightKg/);
  });

  it('T-13: throws when maintenanceKcal is not positive', () => {
    expect(() => computeProjection({ ...baseInput, maintenanceKcal: 0 })).toThrow(/maintenanceKcal/);
  });

  it('T-14: throws when dailyCalorieTarget is not positive', () => {
    expect(() => computeProjection({ ...baseInput, dailyCalorieTarget: 0 })).toThrow(/dailyCalorieTarget/);
  });

  it('T-15: projection points are exactly weeks [0, 8, 12]', () => {
    const result = computeProjection({ ...baseInput });
    expect(result.projectionPoints).toHaveLength(3);
    expect(result.projectionPoints.map((p) => p.weekNumber)).toEqual([0, 8, 12]);
  });
});
