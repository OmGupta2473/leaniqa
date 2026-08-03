import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  toUtcDay, 
  calculateCurrentDailyStreak,
  calculateBestDailyStreak
} from './streaks';
import type { DbDailyMetric } from '@/shared/types/supabase';

describe('streaks', () => {
  describe('toUtcDay', () => {
    it('handles string dates correctly across month boundaries', () => {
      const day1 = toUtcDay('2026-02-28');
      const day2 = toUtcDay('2026-03-01');
      expect(day2 - day1).toBe(1); // 1 day difference
    });

    it('handles string dates across year boundaries', () => {
      const day1 = toUtcDay('2026-12-31');
      const day2 = toUtcDay('2027-01-01');
      expect(day2 - day1).toBe(1); // 1 day difference
    });
    
    it('handles date objects near midnight UTC', () => {
      const d1 = new Date(Date.UTC(2026, 0, 1, 23, 59, 59));
      const d2 = new Date(Date.UTC(2026, 0, 2, 0, 0, 1));
      expect(toUtcDay(d1)).toBe(toUtcDay(new Date(Date.UTC(2026, 0, 1))));
      expect(toUtcDay(d2)).toBe(toUtcDay(new Date(Date.UTC(2026, 0, 2))));
    });
  });

  describe('streak calculations', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(Date.UTC(2026, 0, 5, 12, 0, 0)));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    const createMetric = (dateStr: string, met: boolean): DbDailyMetric => ({
      date: dateStr,
      actual_calories: met ? 1950 : 2500,
      target_calories: 2000,
      actual_protein: met ? 145 : 100,
      target_protein: 150,
      id: '1', user_id: '1', 
      score: 0, water: 0
    });

    it('calculates current streak ignoring today', () => {
      const metrics = [
        createMetric('2026-01-02', true),
        createMetric('2026-01-03', true),
        createMetric('2026-01-04', true),
        createMetric('2026-01-05', true), // Today
      ];
      
      const current = calculateCurrentDailyStreak(metrics);
      expect(current).toBe(3);
    });

    it('resets streak if yesterday is missed', () => {
      const metrics = [
        createMetric('2026-01-02', true),
        createMetric('2026-01-03', true),
        createMetric('2026-01-04', false), // Yesterday missed
        createMetric('2026-01-05', true),
      ];
      
      const current = calculateCurrentDailyStreak(metrics);
      expect(current).toBe(0);
    });

    it('calculates best streak', () => {
      const metrics = [
        createMetric('2026-01-01', true),
        createMetric('2026-01-02', true),
        createMetric('2026-01-03', false), 
        createMetric('2026-01-04', true),
      ];
      const best = calculateBestDailyStreak(metrics);
      expect(best).toBe(2);
    });
  });
});
