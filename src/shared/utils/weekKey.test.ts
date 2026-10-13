import { describe, it, expect } from 'vitest';
import {
  getWeekStart,
  getWeekEnd,
  shiftWeek,
  getWeekDays,
  getWeekLabel,
  computeWeekStatus,
} from './weekKey';

describe('weekKey', () => {
  describe('getWeekStart', () => {
    it('returns itself for a Sunday', () => {
      expect(getWeekStart('2026-10-11')).toBe('2026-10-11');
    });

    it('returns the previous Sunday for a Monday', () => {
      expect(getWeekStart('2026-10-12')).toBe('2026-10-11');
    });

    it('returns the week Sunday for a Saturday', () => {
      expect(getWeekStart('2026-10-17')).toBe('2026-10-11');
    });

    it('rolls forward to the next Sunday for the next Sunday', () => {
      expect(getWeekStart('2026-10-18')).toBe('2026-10-18');
    });
  });

  describe('getWeekEnd', () => {
    it('returns the Saturday 6 days after the week start', () => {
      expect(getWeekEnd('2026-10-11')).toBe('2026-10-17');
    });
  });

  describe('shiftWeek', () => {
    it('shifts back one week', () => {
      expect(shiftWeek('2026-10-11', -1)).toBe('2026-10-04');
    });

    it('shifts forward one week', () => {
      expect(shiftWeek('2026-10-11', 1)).toBe('2026-10-18');
    });

    it('shifts across a month boundary backwards', () => {
      expect(shiftWeek('2026-10-11', -2)).toBe('2026-09-27');
    });

    it('shifts across a month boundary forwards', () => {
      expect(shiftWeek('2026-10-11', 2)).toBe('2026-10-25');
    });

    it('shifts back 52 weeks across a year boundary', () => {
      expect(shiftWeek('2026-10-11', -52)).toBe('2025-10-12');
    });

    it('shifts forward 52 weeks across a year boundary', () => {
      expect(shiftWeek('2026-10-11', 52)).toBe('2027-10-10');
    });
  });

  describe('getWeekDays', () => {
    it('returns exactly 7 entries', () => {
      expect(getWeekDays('2026-10-11')).toHaveLength(7);
    });

    it('first entry is the week start (Sunday)', () => {
      expect(getWeekDays('2026-10-11')[0]).toBe('2026-10-11');
    });

    it('last entry is the week end (Saturday)', () => {
      expect(getWeekDays('2026-10-11')[6]).toBe('2026-10-17');
    });

    it('all days are consecutive', () => {
      const days = getWeekDays('2026-10-11');
      for (let i = 1; i < 7; i++) {
        const prev = days[i - 1];
        const curr = days[i];
        const [yp, mp, dp] = prev.split('-').map(Number);
        const next = new Date(Date.UTC(yp, mp - 1, dp + 1));
        const expected = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-${String(next.getUTCDate()).padStart(2, '0')}`;
        expect(curr).toBe(expected);
      }
    });
  });

  describe('getWeekLabel', () => {
  it('T-WL-1: same-month week', () => {
    expect(getWeekLabel('2026-10-04')).toBe('Oct 4 – Oct 10, 2026');
  });

  it('T-WL-2: cross-month same year', () => {
    expect(getWeekLabel('2026-07-26')).toBe('Jul 26 – Aug 1, 2026');
  });

  it('T-WL-3: cross-year week', () => {
    expect(getWeekLabel('2026-12-27')).toBe('Dec 27, 2026 – Jan 2, 2027');
  });
});

  describe('computeWeekStatus', () => {
    it('returns live when nowIsoDate equals weekEnd', () => {
      expect(computeWeekStatus('2026-10-17', '2026-10-17')).toBe('live');
    });

    it('returns live when nowIsoDate is before weekEnd', () => {
      expect(computeWeekStatus('2026-10-17', '2026-10-15')).toBe('live');
    });

    it('returns final when nowIsoDate is after weekEnd', () => {
      expect(computeWeekStatus('2026-10-17', '2026-10-18')).toBe('final');
    });

    it('handles year-end case: week containing 2026-12-31', () => {
      // Week containing 2026-12-31: starts 2026-12-27 (Sun), ends 2027-01-02 (Sat)
      expect(computeWeekStatus('2027-01-02', '2026-12-31')).toBe('live');
      expect(computeWeekStatus('2027-01-02', '2027-01-03')).toBe('final');
    });
  });
});