import { describe, it, expect } from 'vitest';
import { buildComparisons, colorForTrend } from './weekComparison';
import type { DbWeeklyReport, WeeklyDaySummary } from '@/shared/types/supabase';

function makeReport(overrides: Partial<DbWeeklyReport> = {}): DbWeeklyReport {
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
    day_summaries: [] as WeeklyDaySummary[],
    computed_at: '2026-10-11T00:00:00Z',
    finalized_at: null,
    created_at: '2026-10-11T00:00:00Z',
    updated_at: '2026-10-11T00:00:00Z',
    ...overrides,
  };
}

describe('buildComparisons', () => {
  it('T-WC-1: null previous week → all trends unavailable', () => {
    const result = buildComparisons(makeReport(), null);
    expect(result).toHaveLength(4);
    for (const m of result) {
      expect(m.trend).toBe('unavailable');
      expect(m.previous).toBeNull();
      expect(m.deltaVsPrevious).toBeNull();
    }
  });

  it('T-WC-2: previous week with 0 logged days → trends unavailable', () => {
    const prev = makeReport({ days_with_meals: 0 });
    const result = buildComparisons(makeReport(), prev);
    for (const m of result) {
      expect(m.trend).toBe('unavailable');
    }
  });

  it('T-WC-3: same target, current closer → toward', () => {
    const current = makeReport({ avg_calories: 2050, target_calories: 2000 });
    const previous = makeReport({ avg_calories: 2200, target_calories: 2000 });
    const result = buildComparisons(current, previous);
    const cal = result.find((m) => m.key === 'calories')!;
    expect(cal.trend).toBe('toward');
    expect(cal.deltaVsPrevious).toBe(-150);
    expect(cal.deltaVsTarget).toBe(50);
  });

  it('T-WC-4: same target, current further → away', () => {
    const current = makeReport({ avg_calories: 2400, target_calories: 2000 });
    const previous = makeReport({ avg_calories: 2050, target_calories: 2000 });
    const result = buildComparisons(current, previous);
    const cal = result.find((m) => m.key === 'calories')!;
    expect(cal.trend).toBe('away');
  });

  it('T-WC-5: different targets — change of target that moves toward new target still counts as toward', () => {
    // Previous week: 1700 target, 1900 actual → 200 away
    // Current week: 2000 target, 1950 actual → 50 away
    // Raw calories decreased, but distance from target dropped → toward.
    const current = makeReport({ avg_calories: 1950, target_calories: 2000 });
    const previous = makeReport({ avg_calories: 1900, target_calories: 1700 });
    const result = buildComparisons(current, previous);
    const cal = result.find((m) => m.key === 'calories')!;
    expect(cal.trend).toBe('toward');
  });

  it('T-WC-6: bulk-direction case — calories rose toward a higher target', () => {
    // Previous: target 2300, avg 2100 → 200 below
    // Current:  target 2300, avg 2280 → 20 below
    // Raw calories went up, but that is toward target → toward.
    const current = makeReport({ avg_calories: 2280, target_calories: 2300 });
    const previous = makeReport({ avg_calories: 2100, target_calories: 2300 });
    const result = buildComparisons(current, previous);
    const cal = result.find((m) => m.key === 'calories')!;
    expect(cal.trend).toBe('toward');
  });

  it('T-WC-7: no meaningful change → neutral', () => {
    const current = makeReport({ avg_calories: 2010, target_calories: 2000 });
    const previous = makeReport({ avg_calories: 2005, target_calories: 2000 });
    const result = buildComparisons(current, previous);
    const cal = result.find((m) => m.key === 'calories')!;
    expect(cal.trend).toBe('neutral');
  });

  it('T-WC-8: exact same value and target → neutral, not toward', () => {
    const result = buildComparisons(makeReport(), makeReport());
    for (const m of result) {
      expect(m.trend).toBe('neutral');
      expect(m.deltaVsPrevious).toBe(0);
    }
  });

  it('T-WC-9: protein trend is independent of calorie trend', () => {
    const current = makeReport({
      avg_calories: 2400, target_calories: 2000,   // away
      avg_protein_g: 150, target_protein_g: 150,   // perfectly on target
    });
    const previous = makeReport({
      avg_calories: 2000, target_calories: 2000,
      avg_protein_g: 100, target_protein_g: 150,
    });
    const result = buildComparisons(current, previous);
    expect(result.find((m) => m.key === 'calories')!.trend).toBe('away');
    expect(result.find((m) => m.key === 'protein')!.trend).toBe('toward');
  });

  it('T-WC-10: returns exactly four metrics in a fixed order', () => {
    const result = buildComparisons(makeReport(), makeReport());
    expect(result.map((m) => m.key)).toEqual(['calories', 'protein', 'carbs', 'fat']);
  });
    it('T-WC-11: current report insufficient → trend is limited', () => {
    const current = makeReport({ confidence: 'insufficient' });
    const previous = makeReport();
    const result = buildComparisons(current, previous);
    for (const m of result) {
      expect(m.trend).toBe('limited');
    }
  });

  it('T-WC-12: previous report insufficient → trend is limited', () => {
    const current = makeReport();
    const previous = makeReport({ confidence: 'insufficient' });
    const result = buildComparisons(current, previous);
    for (const m of result) {
      expect(m.trend).toBe('limited');
    }
  });

  it('T-WC-13: current report has fewer than 3 logged days → limited', () => {
    const current = makeReport({ days_with_meals: 2, confidence: 'insufficient' });
    const previous = makeReport();
    const result = buildComparisons(current, previous);
    for (const m of result) {
      expect(m.trend).toBe('limited');
    }
  });

  it('T-WC-14: previous report has fewer than 3 logged days → limited', () => {
    const current = makeReport();
    const previous = makeReport({ days_with_meals: 2, confidence: 'insufficient' });
    const result = buildComparisons(current, previous);
    for (const m of result) {
      expect(m.trend).toBe('limited');
    }
  });

  it('T-WC-15: both reports healthy → existing trend logic unchanged', () => {
    const current = makeReport({ avg_calories: 2050, target_calories: 2000 });
    const previous = makeReport({ avg_calories: 2200, target_calories: 2000 });
    const result = buildComparisons(current, previous);
    const cal = result.find((m) => m.key === 'calories')!;
    expect(cal.trend).toBe('toward');
  });

  it('T-WC-16: limited trend keeps the numeric delta', () => {
    const current = makeReport({ confidence: 'insufficient', avg_calories: 800 });
    const previous = makeReport({ avg_calories: 1000 });
    const result = buildComparisons(current, previous);
    const cal = result.find((m) => m.key === 'calories')!;
    expect(cal.trend).toBe('limited');
    expect(cal.deltaVsPrevious).toBe(-200);
    expect(cal.previous).toBe(1000);
  });
});

describe('colorForTrend', () => {
  it('T-CT-1: toward → lime', () => {
    expect(colorForTrend('toward')).toBe('#D4FF00');
  });
  it('T-CT-2: away → coral', () => {
    expect(colorForTrend('away')).toBe('#FF4D1C');
  });
  it('T-CT-3: neutral → dim', () => {
    expect(colorForTrend('neutral')).toBe('rgba(255,255,255,0.5)');
  });
  it('T-CT-4: unavailable → dim', () => {
    expect(colorForTrend('unavailable')).toBe('rgba(255,255,255,0.5)');
  });
    it('T-CT-5: limited → dim', () => {
    expect(colorForTrend('limited')).toBe('rgba(255,255,255,0.5)');
  });
});