import { describe, it, expect } from 'vitest';
import {
  deriveInsights,
  deriveNextActions,
  derivePatterns,
  deriveMacroBalance,
} from './weeklyInsights';
import type { DbWeeklyReport, WeeklyDaySummary } from '@/shared/types/supabase';

function day(overrides: Partial<WeeklyDaySummary> = {}): WeeklyDaySummary {
  return {
    date: '2026-10-11',
    dayOfWeek: 0,
    logged: true,
    isToday: false,
    calories: 2000,
    proteinG: 150,
    carbsG: 200,
    fatG: 60,
    status: 'on_target',
    score: 100,
    ...overrides,
  };
}

function report(overrides: Partial<DbWeeklyReport> = {}): DbWeeklyReport {
  return {
    user_id: 'u1',
    week_start: '2026-10-04',
    week_end: '2026-10-10',
    status: 'final',
    days_with_meals: 7,
    days_with_weight: 5,
    total_calories: 14000,
    avg_calories: 2000,
    target_calories: 2000,
    total_protein_g: 1050,
    avg_protein_g: 150,
    target_protein_g: 150,
    total_carbs_g: 1400,
    avg_carbs_g: 200,
    target_carbs_g: 200,
    total_fat_g: 420,
    avg_fat_g: 60,
    target_fat_g: 60,
    weekly_score: 90,
    confidence: 'high',
    day_summaries: [],
    computed_at: '2026-10-11T00:00:00Z',
    finalized_at: null,
    created_at: '2026-10-11T00:00:00Z',
    updated_at: '2026-10-11T00:00:00Z',
    ...overrides,
  };
}

describe('deriveNextActions', () => {
  it('T-DA-1: 0 logged days returns []', () => {
    expect(deriveNextActions(report({ days_with_meals: 0 }))).toEqual([]);
  });

  it('T-DA-2: 1 logged day with insufficient confidence returns [] even when protein is short', () => {
    const r = report({
      days_with_meals: 1,
      confidence: 'insufficient',
      day_summaries: [day({ proteinG: 30, status: 'protein_low' })],
    });
    expect(deriveNextActions(r)).toEqual([]);
  });

  it('T-DA-3: 2 logged days with insufficient confidence returns []', () => {
    const r = report({
      days_with_meals: 2,
      confidence: 'insufficient',
      day_summaries: [
        day({ proteinG: 30, status: 'protein_low' }),
        day({ proteinG: 30, status: 'protein_low' }),
      ],
    });
    expect(deriveNextActions(r)).toEqual([]);
  });

  it('T-DA-4: 3 logged days with medium confidence permits a protein action', () => {
    const r = report({
      days_with_meals: 3,
      confidence: 'low',
      day_summaries: [
        day({ proteinG: 30, status: 'protein_low' }),
        day({ proteinG: 30, status: 'protein_low' }),
        day({ proteinG: 30, status: 'protein_low' }),
      ],
    });
    const actions = deriveNextActions(r);
    expect(actions.length).toBeGreaterThan(0);
    expect(actions.some((a) => a.id === 'action_protein')).toBe(true);
  });

  it('T-DA-5: 7 perfect days returns the maintain action', () => {
    const r = report({
      days_with_meals: 7,
      confidence: 'high',
      day_summaries: Array.from({ length: 7 }, () => day()),
    });
    const actions = deriveNextActions(r);
    expect(actions).toEqual([{ id: 'action_maintain', text: expect.any(String) }]);
  });

  it('T-DA-6: never returns more than 3 actions', () => {
    const r = report({
      days_with_meals: 3,
      confidence: 'low',
      day_summaries: [
        day({ proteinG: 30, status: 'protein_low' }),
        day({ calories: 2600, status: 'over' }),
        day({ calories: 2600, status: 'over' }),
      ],
    });
    expect(deriveNextActions(r).length).toBeLessThanOrEqual(3);
  });
});

describe('deriveInsights', () => {
  it('T-DI-1: empty week returns []', () => {
    expect(deriveInsights(report({ days_with_meals: 0 }))).toEqual([]);
  });

  it('T-DI-2: insufficient week retains the informational logging insight', () => {
    const r = report({
      days_with_meals: 1,
      confidence: 'insufficient',
      day_summaries: [day({ proteinG: 30, status: 'protein_low' })],
    });
    const insights = deriveInsights(r);
    expect(insights.some((i) => i.id === 'logging_limited')).toBe(true);
  });

  it('T-DI-3: insufficient week does not produce a protein_short claim', () => {
    const r = report({
      days_with_meals: 1,
      confidence: 'insufficient',
      day_summaries: [day({ proteinG: 30, status: 'protein_low' })],
    });
    const insights = deriveInsights(r);
    expect(insights.some((i) => i.id === 'protein_short')).toBe(false);
  });

  it('T-DI-4: strong protein week shows the positive protein insight', () => {
    const r = report({
      days_with_meals: 7,
      confidence: 'high',
      day_summaries: Array.from({ length: 7 }, () => day()),
    });
    const insights = deriveInsights(r);
    expect(insights.some((i) => i.id === 'protein_strong')).toBe(true);
  });

  it('T-DI-5: returns at most 4 insights', () => {
    const r = report({
      days_with_meals: 7,
      confidence: 'high',
      day_summaries: [
        day({ calories: 2600, status: 'over' }),
        day({ calories: 2600, status: 'over' }),
        day({ calories: 2600, status: 'over' }),
        day({ proteinG: 30, status: 'protein_low' }),
        day({ proteinG: 30, status: 'protein_low' }),
        day({ proteinG: 30, status: 'protein_low' }),
        day({ proteinG: 30, status: 'protein_low' }),
      ],
    });
    expect(deriveInsights(r).length).toBeLessThanOrEqual(4);
  });
});

describe('derivePatterns', () => {
  it('T-DP-1: fewer than 3 logged days returns []', () => {
    const r = report({
      days_with_meals: 2,
      day_summaries: [day(), day()],
    });
    expect(derivePatterns(r)).toEqual([]);
  });

  it('T-DP-2: weekend-vs-weekday gap over 300 kcal produces an observation', () => {
    const r = report({
      days_with_meals: 7,
      day_summaries: [
        day({ dayOfWeek: 0, calories: 2600 }),
        day({ dayOfWeek: 1, calories: 1900 }),
        day({ dayOfWeek: 2, calories: 1900 }),
        day({ dayOfWeek: 3, calories: 1900 }),
        day({ dayOfWeek: 4, calories: 1900 }),
        day({ dayOfWeek: 5, calories: 1900 }),
        day({ dayOfWeek: 6, calories: 2600 }),
      ],
    });
    const patterns = derivePatterns(r);
    expect(patterns.some((p) => p.id === 'weekend_weekday')).toBe(true);
  });

  it('T-DP-3: largest single-day deviation over 500 kcal produces an observation', () => {
    const r = report({
      days_with_meals: 7,
      target_calories: 2000,
      day_summaries: [
        day(),
        day(),
        day(),
        day(),
        day(),
        day(),
        day({ calories: 2600 }),
      ],
    });
    const patterns = derivePatterns(r);
    expect(patterns.some((p) => p.id === 'largest_deviation')).toBe(true);
  });

  it('T-DP-4: returns at most 2 patterns', () => {
    const r = report({
      days_with_meals: 7,
      target_calories: 2000,
      day_summaries: [
        day({ dayOfWeek: 0, calories: 2900 }),
        day({ dayOfWeek: 1, calories: 1800 }),
        day({ dayOfWeek: 2, calories: 1800 }),
        day({ dayOfWeek: 3, calories: 1800 }),
        day({ dayOfWeek: 4, calories: 1800 }),
        day({ dayOfWeek: 5, calories: 1800 }),
        day({ dayOfWeek: 6, calories: 2900 }),
      ],
    });
    expect(derivePatterns(r).length).toBeLessThanOrEqual(2);
  });
});

describe('deriveMacroBalance', () => {
  it('T-DM-1: exact 100/0/0', () => {
    const r = report({
      total_protein_g: 0, total_carbs_g: 0, total_fat_g: 0,
      target_protein_g: 100, target_carbs_g: 0, target_fat_g: 0,
    });
    const b = deriveMacroBalance(r);
    expect(b.proteinPct + b.carbsPct + b.fatPct).toBe(0);
  });

  it('T-DM-2: values that naively round to 99 sum to exactly 100', () => {
    // 100g protein (400), 100g carbs (400), 200g fat (1800). Total 2600.
    // Exact percents: 15.38, 15.38, 69.23 -> naive round = 15+15+69 = 99.
    const r = report({
      total_protein_g: 100, total_carbs_g: 100, total_fat_g: 200,
      target_protein_g: 0, target_carbs_g: 0, target_fat_g: 1,
    });
    const b = deriveMacroBalance(r);
    expect(b.proteinPct + b.carbsPct + b.fatPct).toBe(100);
    expect(b.proteinPct).toBe(16);
    expect(b.carbsPct).toBe(15);
    expect(b.fatPct).toBe(69);
  });

  it('T-DM-3: values that naively round to 101 sum to exactly 100', () => {
    // 100g protein (400), 200g carbs (800), 80g fat (720). Total 1920.
    // Exact: 20.833, 41.667, 37.5 -> naive round = 21+42+38 = 101.
    const r = report({
      total_protein_g: 100, total_carbs_g: 200, total_fat_g: 80,
      target_protein_g: 0, target_carbs_g: 0, target_fat_g: 1,
    });
    const b = deriveMacroBalance(r);
    expect(b.proteinPct + b.carbsPct + b.fatPct).toBe(100);
    expect(b.proteinPct).toBe(21);
    expect(b.carbsPct).toBe(42);
    expect(b.fatPct).toBe(37);
  });

  it('T-DM-4: tie on remainder allocates to protein first', () => {
    // 250g protein (1000), 250g carbs (1000), 100g fat (900). Total 2900.
    // Exact: 34.4828, 34.4828, 31.0345 -> floor 34+34+31=99. Leftover 1.
    // p and c tie on remainder 0.4828. Tie-break: protein wins.
    const r = report({
      total_protein_g: 250, total_carbs_g: 250, total_fat_g: 100,
      target_protein_g: 0, target_carbs_g: 0, target_fat_g: 1,
    });
    const b = deriveMacroBalance(r);
    expect(b.proteinPct).toBe(35);
    expect(b.carbsPct).toBe(34);
    expect(b.fatPct).toBe(31);
    expect(b.proteinPct + b.carbsPct + b.fatPct).toBe(100);
  });

  it('T-DM-5: zero total preserves safe zero behavior', () => {
    const r = report({
      total_protein_g: 0, total_carbs_g: 0, total_fat_g: 0,
      target_protein_g: 0, target_carbs_g: 0, target_fat_g: 0,
    });
    const b = deriveMacroBalance(r);
    expect(b.proteinPct).toBe(0);
    expect(b.carbsPct).toBe(0);
    expect(b.fatPct).toBe(0);
    expect(b.biggestGapKey).toBe('none');
  });

  it('T-DM-6: both current and target sum to exactly 100', () => {
    const r = report({
      total_protein_g: 150, total_carbs_g: 200, total_fat_g: 60,
      target_protein_g: 132, target_carbs_g: 109, target_fat_g: 42,
    });
    const b = deriveMacroBalance(r);
    expect(b.proteinPct + b.carbsPct + b.fatPct).toBe(100);
    expect(b.targetProteinPct + b.targetCarbsPct + b.targetFatPct).toBe(100);
  });

  it('T-DM-7: biggest gap key identifies the largest deviation', () => {
    const r = report({
      // Current: 10/45/45 (very high fat+carbs). Target: 40/30/30.
      total_protein_g: 25, total_carbs_g: 112, total_fat_g: 50,
      target_protein_g: 100, target_carbs_g: 75, target_fat_g: 33,
    });
    const b = deriveMacroBalance(r);
    expect(b.biggestGapKey).toBe('protein');
  });
});