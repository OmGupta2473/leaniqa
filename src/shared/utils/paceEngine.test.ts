import { describe, it, expect } from 'vitest';
import {
  computeMaintenancePlan,
  computePacePlan,
  CUT_PACES,
  type CutPace,
} from './paceEngine';

const base = { weightKg: 78, maintenanceKcal: 2136 };

describe('computeMaintenancePlan', () => {
  it('TM-1: proteinG === 125 (78 * 1.6 = 124.8 → 125)', () => {
    const result = computeMaintenancePlan(base);
    expect(result.proteinG).toBe(125);
  });

  it('TM-2: fatG === 70 (78 * 0.9 = 70.2 → 70)', () => {
    const result = computeMaintenancePlan(base);
    expect(result.fatG).toBe(70);
  });

  it('TM-3: carbsG === 252', () => {
    const result = computeMaintenancePlan(base);
    expect(result.carbsG).toBe(252);
  });

  it('TM-4: throws when weightKg <= 0', () => {
    expect(() => computeMaintenancePlan({ ...base, weightKg: 0 })).toThrow('weightKg must be positive');
    expect(() => computeMaintenancePlan({ ...base, weightKg: -1 })).toThrow('weightKg must be positive');
  });

  it('TM-5: throws when maintenanceKcal <= 0', () => {
    expect(() => computeMaintenancePlan({ ...base, maintenanceKcal: 0 })).toThrow('maintenanceKcal must be positive');
    expect(() => computeMaintenancePlan({ ...base, maintenanceKcal: -1 })).toThrow('maintenanceKcal must be positive');
  });
});

describe('computePacePlan', () => {
  const paceTests: Array<{ pace: CutPace; expected: ReturnType<typeof computePacePlan> }> = [
    {
      pace: 22,
      expected: {
        pace: 22,
        targetKcal: 1666,
        proteinG: 172,
        fatG: 55,
        carbsG: 121,
        deficitKcal: 470,
        deficitPct: 22,
      },
    },
    {
      pace: 20,
      expected: {
        pace: 20,
        targetKcal: 1709,
        proteinG: 164,
        fatG: 59,
        carbsG: 131,
        deficitKcal: 427,
        deficitPct: 20,
      },
    },
    {
      pace: 18,
      expected: {
        pace: 18,
        targetKcal: 1752,
        proteinG: 156,
        fatG: 62,
        carbsG: 143,
        deficitKcal: 384,
        deficitPct: 18,
      },
    },
    {
      pace: 16,
      expected: {
        pace: 16,
        targetKcal: 1794,
        proteinG: 148,
        fatG: 66,
        carbsG: 152,
        deficitKcal: 342,
        deficitPct: 16,
      },
    },
  ];

  paceTests.forEach(({ pace, expected }) => {
    it(`TP-${pace}: matches expected values`, () => {
      const result = computePacePlan({ ...base, pace });
      expect(result).toEqual(expected);
    });
  });

  it('T-MONO-1: monotonicity — protein non-decreasing, targetKcal non-increasing as pace increases', () => {
    const paces: CutPace[] = [16, 18, 20, 22];
    const results = paces.map((p) => computePacePlan({ ...base, pace: p }));

    for (let i = 1; i < results.length; i++) {
      expect(results[i].proteinG).toBeGreaterThanOrEqual(results[i - 1].proteinG);
      expect(results[i].targetKcal).toBeLessThanOrEqual(results[i - 1].targetKcal);
    }
  });

  it('T-MONO-2: fat floor — fatG >= weightKg * 0.7 for every pace', () => {
    CUT_PACES.forEach((pace) => {
      const result = computePacePlan({ ...base, pace });
      expect(result.fatG).toBeGreaterThanOrEqual(base.weightKg * 0.7);
    });
  });

  it('T-MACRO-1: macros + calories consistency — within 4 kcal of targetKcal', () => {
    CUT_PACES.forEach((pace) => {
      const result = computePacePlan({ ...base, pace });
      const kcalFromMacros = result.proteinG * 4 + result.fatG * 9 + result.carbsG * 4;
      expect(Math.abs(kcalFromMacros - result.targetKcal)).toBeLessThanOrEqual(4);
    });
  });

  it('T-MACRO-2: for 50kg and 120kg users, all paces produce non-negative carbsG', () => {
    [50, 120].forEach((weightKg) => {
      CUT_PACES.forEach((pace) => {
        const result = computePacePlan({ weightKg, maintenanceKcal: 2136, pace });
        expect(result.carbsG).toBeGreaterThanOrEqual(0);
      });
    });
  });

  it('T-VALID-1: throws when pace is not in [16, 18, 20, 22]', () => {
    // @ts-expect-error testing runtime validation
    expect(() => computePacePlan({ ...base, pace: 17 })).toThrow('pace must be one of 22, 20, 18, 16');
  });
});