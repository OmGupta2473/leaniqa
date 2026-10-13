import { describe, it, expect } from 'vitest';
import { deriveHeroSummary, colorForDayBar } from './weeklyPresentation';
import type { WeeklyDaySummary } from '@/shared/types/supabase';

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

describe('deriveHeroSummary', () => {
  it('T-HS-1: empty week', () => {
    const result = deriveHeroSummary({
      daysWithMeals: 0,
      targetProteinG: 150,
      daySummaries: [],
    });
    expect(result).toBe('No meals logged this week.');
  });

  it('T-HS-2: 1–2 logged days → insufficient message', () => {
    const result = deriveHeroSummary({
      daysWithMeals: 2,
      targetProteinG: 150,
      daySummaries: [day(), day()],
    });
    expect(result).toBe('Not enough data yet for a strong summary.');
  });

  it('T-HS-3: perfect week', () => {
    const days = Array.from({ length: 7 }, () => day());
    const result = deriveHeroSummary({
      daysWithMeals: 7,
      targetProteinG: 150,
      daySummaries: days,
    });
    expect(result).toBe('Protein hit every logged day. Calories stayed on target.');
  });

  it('T-HS-4: protein short every day, calories fine', () => {
    const days = Array.from({ length: 5 }, () =>
      day({ proteinG: 50, status: 'protein_low' }),
    );
    const result = deriveHeroSummary({
      daysWithMeals: 5,
      targetProteinG: 150,
      daySummaries: days,
    });
    expect(result).toBe('Protein fell short every logged day. Calories stayed on target.');
  });

  it('T-HS-5: calories ran high 3 days', () => {
    const days = [
      day({ status: 'over' }),
      day({ status: 'over' }),
      day({ status: 'over' }),
      day(),
      day(),
      day(),
      day(),
    ];
    const result = deriveHeroSummary({
      daysWithMeals: 7,
      targetProteinG: 150,
      daySummaries: days,
    });
    expect(result).toBe('Protein hit every logged day. Calories ran high on 3 days.');
  });

  it('T-HS-6: partial protein, 5 of 7', () => {
    const days = [
      day(),
      day(),
      day(),
      day(),
      day(),
      day({ proteinG: 50, status: 'protein_low' }),
      day({ proteinG: 50, status: 'protein_low' }),
    ];
    const result = deriveHeroSummary({
      daysWithMeals: 7,
      targetProteinG: 150,
      daySummaries: days,
    });
    expect(result).toContain('Protein hit 5 of 7 days');
  });
});

describe('colorForDayBar', () => {
  it('T-HC-1: on_target → lime', () => {
    expect(colorForDayBar('on_target')).toBe('#D4FF00');
  });
  it('T-HC-2: under → amber', () => {
    expect(colorForDayBar('under')).toBe('#fbbf24');
  });
  it('T-HC-3: over → red', () => {
    expect(colorForDayBar('over')).toBe('#FF4D1C');
  });
  it('T-HC-4: protein_low → amber', () => {
    expect(colorForDayBar('protein_low')).toBe('#fbbf24');
  });
  it('T-HC-5: not_logged → dim', () => {
    expect(colorForDayBar('not_logged')).toBe('rgba(255,255,255,0.06)');
  });
});