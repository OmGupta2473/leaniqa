import { describe, it, expect } from 'vitest';
import { AWARD_CATALOG, AWARD_BY_ID, evaluateAwards, nextClosestAward } from './awardsEngine';
import type { DbDailyMetric, DbMealLog, DbWeightLog, DbUserAward } from '@/shared/types/supabase';

const TODAY = '2026-10-06';
const SEVEN_DAYS = ['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05'];
const FIVE_DAYS = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05'];
const THREE_DAYS = ['2026-10-03', '2026-10-04', '2026-10-05'];

function makeMetric(date: string, opts: Partial<DbDailyMetric> = {}): DbDailyMetric {
  return {
    user_id: 'u1',
    date,
    target_calories: 2000,
    actual_calories: 2000,
    target_protein: 150,
    actual_protein: 150,
    score: 100,
    ...opts,
  };
}

function makeMeal(): DbMealLog {
  return {
    user_id: 'u1',
    meal_text: 'test',
    calories: 300,
    protein: 20,
    fat: 10,
    carbs: 30,
    meal_time: '2026-10-06T12:00:00Z',
  };
}

function makeWeight(date: string): DbWeightLog {
  return { user_id: 'u1', weight: 70, date };
}

function baseInput(overrides: Partial<Parameters<typeof evaluateAwards>[0]> = {}) {
  return {
    metrics: [],
    mealLogs: [],
    weightLogs: [],
    profileCreatedAt: null,
    todayIso: TODAY,
    unlockedAwards: [] as DbUserAward[],
    ...overrides,
  };
}

describe('awardsEngine catalog', () => {
  it('has 22 awards', () => {
    expect(AWARD_CATALOG.length).toBe(22);
  });

  it('has unique ids', () => {
    const ids = new Set(AWARD_CATALOG.map((a) => a.id));
    expect(ids.size).toBe(AWARD_CATALOG.length);
  });

  it('every award has a valid category', () => {
    const cats = new Set(['streak', 'logging', 'protein', 'precision', 'weight', 'milestone']);
    for (const a of AWARD_CATALOG) {
      expect(cats.has(a.category)).toBe(true);
    }
  });

  it('AWARD_BY_ID maps every id', () => {
    for (const a of AWARD_CATALOG) {
      expect(AWARD_BY_ID[a.id]).toBe(a);
    }
  });
});

describe('evaluateAwards', () => {
  it('T-A1: empty input yields all locked', () => {
    const result = evaluateAwards(baseInput());
    expect(result.unlockedCount).toBe(0);
    expect(result.newlyEligible).toHaveLength(0);
    expect(result.progress.every((p) => !p.unlocked)).toBe(true);
    expect(result.totalCount).toBe(22);
  });

  it('T-A2: 3-day streak earns streak_1 and streak_3', () => {
    const metrics = THREE_DAYS.map((d) => makeMetric(d));
    const result = evaluateAwards(baseInput({ metrics }));
    expect(result.newlyEligible).toContain('streak_1');
    expect(result.newlyEligible).toContain('streak_3');
    expect(result.newlyEligible).not.toContain('streak_7');
  });

  it('T-A3: 7-day streak earns streak_7', () => {
    const metrics = SEVEN_DAYS.map((d) => makeMetric(d));
    const result = evaluateAwards(baseInput({ metrics }));
    expect(result.newlyEligible).toContain('streak_7');
  });

  it('T-A4: 25 meal logs earn log_first and log_25', () => {
    const mealLogs = Array.from({ length: 25 }, () => makeMeal());
    const result = evaluateAwards(baseInput({ mealLogs }));
    expect(result.newlyEligible).toContain('log_first');
    expect(result.newlyEligible).toContain('log_25');
    expect(result.newlyEligible).not.toContain('log_100');
  });

  it('T-A5: 100 meal logs earn log_100', () => {
    const mealLogs = Array.from({ length: 100 }, () => makeMeal());
    const result = evaluateAwards(baseInput({ mealLogs }));
    expect(result.newlyEligible).toContain('log_100');
  });

  it('T-A6: 7-day protein hits earn protein_first and protein_7_streak', () => {
    const metrics = SEVEN_DAYS.map((d) => makeMetric(d));
    const result = evaluateAwards(baseInput({ metrics }));
    expect(result.newlyEligible).toContain('protein_first');
    expect(result.newlyEligible).toContain('protein_7_streak');
  });

  it('T-A7: score 100 earns precision_100_first and precision_90_first', () => {
    const metrics = [makeMetric('2026-10-05', { score: 100 })];
    const result = evaluateAwards(baseInput({ metrics }));
    expect(result.newlyEligible).toContain('precision_100_first');
    expect(result.newlyEligible).toContain('precision_90_first');
  });

  it('T-A8: 30 weight logs earn weight_first and weight_30_total', () => {
    const weightLogs = Array.from({ length: 30 }, (_, i) => makeWeight(`2026-09-${String(i + 1).padStart(2, '0')}`));
    const result = evaluateAwards(baseInput({ weightLogs }));
    expect(result.newlyEligible).toContain('weight_first');
    expect(result.newlyEligible).toContain('weight_30_total');
  });

  it('T-A9: 30 days since signup earns first_week_complete and first_month_complete', () => {
    const result = evaluateAwards(baseInput({ profileCreatedAt: '2026-09-06T00:00:00Z' }));
    expect(result.newlyEligible).toContain('first_week_complete');
    expect(result.newlyEligible).toContain('first_month_complete');
  });

  it('T-A10: awards already in unlockedAwards are not newlyEligible', () => {
    const metrics = THREE_DAYS.map((d) => makeMetric(d));
    const unlockedAwards: DbUserAward[] = [
      { user_id: 'u1', award_id: 'streak_1', unlocked_at: '2026-10-05T10:00:00Z' },
    ];
    const result = evaluateAwards(baseInput({ metrics, unlockedAwards }));
    expect(result.newlyEligible).not.toContain('streak_1');
    expect(result.newlyEligible).toContain('streak_3');
    expect(result.unlockedCount).toBe(1);
  });

  it('T-A11: progress percentage is capped at 100 and non-negative', () => {
    const metrics = SEVEN_DAYS.map((d) => makeMetric(d));
    const result = evaluateAwards(baseInput({ metrics }));
    for (const p of result.progress) {
      expect(p.percentage).toBeLessThanOrEqual(100);
      expect(p.percentage).toBeGreaterThanOrEqual(0);
    }
  });

  it('T-A12: earned awards carry unlocked_at', () => {
    const unlockedAwards: DbUserAward[] = [
      { user_id: 'u1', award_id: 'streak_1', unlocked_at: '2026-10-05T10:00:00Z' },
    ];
    const result = evaluateAwards(baseInput({ unlockedAwards }));
    const streak1 = result.progress.find((p) => p.id === 'streak_1');
    expect(streak1?.unlocked).toBe(true);
    expect(streak1?.unlockedAt).toBe('2026-10-05T10:00:00Z');
  });

  it('T-A13: score 90 five days in a row earns precision_90_5_streak', () => {
    const metrics = FIVE_DAYS.map((d) => makeMetric(d, { score: 90 }));
    const result = evaluateAwards(baseInput({ metrics }));
    expect(result.newlyEligible).toContain('precision_90_5_streak');
  });

  it('T-A14: current is capped at target', () => {
    const mealLogs = Array.from({ length: 200 }, () => makeMeal());
    const result = evaluateAwards(baseInput({ mealLogs }));
    const log100 = result.progress.find((p) => p.id === 'log_100');
    expect(log100?.current).toBe(100);
    expect(log100?.target).toBe(100);
    expect(log100?.percentage).toBe(100);
  });

  it('T-A15: eligibleCount is independent of unlockedCount', () => {
    const mealLogs = Array.from({ length: 25 }, () => makeMeal());
    const unlockedAwards: DbUserAward[] = [
      { user_id: 'u1', award_id: 'log_first', unlocked_at: '2026-10-01T00:00:00Z' },
    ];
    const result = evaluateAwards(baseInput({ mealLogs, unlockedAwards }));
    expect(result.unlockedCount).toBe(1);
    expect(result.eligibleCount).toBe(2);
  });
});

describe('nextClosestAward', () => {
  it('T-N1: returns null when all are earned or none started', () => {
    const result = evaluateAwards(baseInput());
    expect(nextClosestAward(result)).toBeNull();
  });

  it('T-N2: returns the locked award with the highest percentage', () => {
    const metrics = THREE_DAYS.map((d) => makeMetric(d));
    const result = evaluateAwards(baseInput({ metrics }));
    const next = nextClosestAward(result);
    expect(next).not.toBeNull();
    expect(next!.eligible).toBe(false);
    expect(next!.current).toBeGreaterThan(0);
  });
});