import { describe, it, expect } from 'vitest';
import { deriveCarbsFromKcal, isMacroSplitFeasible } from './macroReconciliation';

describe('deriveCarbsFromKcal', () => {
  it('T-MR-1: 1700 kcal / 104P / 52F yields 204C and exactly 1700 kcal of macros', () => {
    const r = deriveCarbsFromKcal(1700, 104, 52);
    expect(r.feasible).toBe(true);
    expect(r.carbsG).toBe(204);
    expect(r.remainderKcal).toBe(816);
    expect(104 * 4 + 52 * 9 + 204 * 4).toBe(1700);
  });

  it('T-MR-2: infeasible when protein + fat exceed the target', () => {
    const r = deriveCarbsFromKcal(1700, 500, 100);
    expect(r.feasible).toBe(false);
    expect(r.carbsG).toBe(0);
    expect(r.remainderKcal).toBeLessThan(0);
  });

  it('T-MR-3: zero protein and zero fat consume nothing', () => {
    const r = deriveCarbsFromKcal(2000, 0, 0);
    expect(r.feasible).toBe(true);
    expect(r.carbsG).toBe(500);
    expect(r.remainderKcal).toBe(2000);
  });

  it('T-MR-4: exact-boundary case (remainder = 0) is feasible with zero carbs', () => {
    const r = deriveCarbsFromKcal(1000, 160, 40); // 160*4 + 40*9 = 1000
    expect(r.feasible).toBe(true);
    expect(r.carbsG).toBe(0);
    expect(r.remainderKcal).toBe(0);
  });

  it('T-MR-5: rounds .25 down and .75 up', () => {
    // remainder = 813 → 203.25 → 203
    const rDown = deriveCarbsFromKcal(1700, 116, 47);
    expect(rDown.remainderKcal).toBe(813);
    expect(rDown.carbsG).toBe(203);

    // remainder = 815 → 203.75 → 204
    const rUp = deriveCarbsFromKcal(1700, 111, 49);
    expect(rUp.remainderKcal).toBe(815);
    expect(rUp.carbsG).toBe(204);
  });

  it('T-MR-6: macro kcal stays within ±4 of target after rounding', () => {
    for (const [kcal, p, f] of [
      [1700, 104, 52],
      [2000, 150, 70],
      [2200, 130, 60],
      [1800, 120, 55],
      [2500, 180, 80],
    ] as const) {
      const r = deriveCarbsFromKcal(kcal, p, f);
      expect(r.feasible).toBe(true);
      const macroKcal = p * 4 + f * 9 + r.carbsG * 4;
      expect(Math.abs(macroKcal - kcal)).toBeLessThanOrEqual(4);
    }
  });

  it('T-MR-7: throws on negative input', () => {
    expect(() => deriveCarbsFromKcal(-100, 100, 50)).toThrow();
    expect(() => deriveCarbsFromKcal(1700, -10, 50)).toThrow();
    expect(() => deriveCarbsFromKcal(1700, 100, -5)).toThrow();
  });

  it('T-MR-8: throws on non-finite input', () => {
    expect(() => deriveCarbsFromKcal(NaN, 100, 50)).toThrow();
    expect(() => deriveCarbsFromKcal(1700, Infinity, 50)).toThrow();
    expect(() => deriveCarbsFromKcal(1700, 100, -Infinity)).toThrow();
  });
});

describe('isMacroSplitFeasible', () => {
  it('T-MR-9: mirrors deriveCarbsFromKcal feasibility', () => {
    expect(isMacroSplitFeasible(1700, 104, 52)).toBe(true);
    expect(isMacroSplitFeasible(1700, 500, 100)).toBe(false);
  });
});