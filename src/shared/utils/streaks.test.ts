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
    
    it('handles Date inputs on the IST midnight boundary', () => {
      // IST midnight = 18:30 UTC previous day.
      // 18:29:59 UTC = 23:59:59 IST same calendar day.
      // 18:30:00 UTC = 00:00:00 IST next calendar day.
      const justBefore = new Date('2026-01-01T18:29:59Z');
      const justAfter = new Date('2026-01-01T18:30:00Z');
      expect(toUtcDay(justBefore)).toBe(toUtcDay('2026-01-01'));
      expect(toUtcDay(justAfter)).toBe(toUtcDay('2026-01-02'));
      // Also verify the day-number delta is exactly 1 across the boundary:
      expect(toUtcDay(justAfter) - toUtcDay(justBefore)).toBe(1);
    });

    it('treats the current instant as IST today, not host-local today', () => {
      // 2026-01-01T22:00:00Z = 03:30 IST on Jan 2.
      const istEarlyMorning = new Date('2026-01-01T22:00:00Z');
      expect(toUtcDay(istEarlyMorning)).toBe(toUtcDay('2026-01-02'));
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
      score: 0
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
