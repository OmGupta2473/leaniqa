import { describe, it, expect } from 'vitest';
import { getWeekSelectorState, shouldShowGraceHint } from './weekNavigation';

describe('getWeekSelectorState', () => {
  const CURRENT = '2026-10-11';
  const EARLIEST = '2026-07-19';

  it('T-NAV-1: current week — can go prev, cannot go next', () => {
    const s = getWeekSelectorState(CURRENT, CURRENT, EARLIEST);
    expect(s.isCurrentWeek).toBe(true);
    expect(s.canGoPrev).toBe(true);
    expect(s.canGoNext).toBe(false);
    expect(s.prevWeekStart).toBe('2026-10-04');
    expect(s.nextWeekStart).toBeNull();
  });

  it('T-NAV-2: earliest week — can go next, cannot go prev', () => {
    const s = getWeekSelectorState(EARLIEST, CURRENT, EARLIEST);
    expect(s.isCurrentWeek).toBe(false);
    expect(s.canGoPrev).toBe(false);
    expect(s.canGoNext).toBe(true);
    expect(s.prevWeekStart).toBeNull();
    expect(s.nextWeekStart).toBe('2026-07-26');
  });

  it('T-NAV-3: middle week — both directions enabled', () => {
    const s = getWeekSelectorState('2026-08-16', CURRENT, EARLIEST);
    expect(s.canGoPrev).toBe(true);
    expect(s.canGoNext).toBe(true);
    expect(s.prevWeekStart).toBe('2026-08-09');
    expect(s.nextWeekStart).toBe('2026-08-23');
  });

  it('T-NAV-4: no reports yet — earliest falls back to current, prev disabled', () => {
    const s = getWeekSelectorState(CURRENT, CURRENT, CURRENT);
    expect(s.isCurrentWeek).toBe(true);
    expect(s.canGoPrev).toBe(false);
    expect(s.canGoNext).toBe(false);
  });

  it('T-NAV-5: one week before current — next returns toward current', () => {
    const s = getWeekSelectorState('2026-10-04', CURRENT, EARLIEST);
    expect(s.canGoPrev).toBe(true);
    expect(s.canGoNext).toBe(true);
    expect(s.nextWeekStart).toBe('2026-10-11');
  });

  it('T-NAV-6: two weeks before earliest — both disabled (guard against going too far)', () => {
    const s = getWeekSelectorState('2026-07-05', CURRENT, EARLIEST);
    expect(s.canGoPrev).toBe(false);
    expect(s.canGoNext).toBe(true);
  });
});

describe('shouldShowGraceHint', () => {
  const WEEK_END = '2026-10-17'; // Saturday

  it('T-GR-1: Saturday itself — false (week still live)', () => {
    expect(shouldShowGraceHint(WEEK_END, '2026-10-17')).toBe(false);
  });

  it('T-GR-2: Sunday after — true', () => {
    expect(shouldShowGraceHint(WEEK_END, '2026-10-18')).toBe(true);
  });

  it('T-GR-3: Monday after — true', () => {
    expect(shouldShowGraceHint(WEEK_END, '2026-10-19')).toBe(true);
  });

  it('T-GR-4: Tuesday after — false', () => {
    expect(shouldShowGraceHint(WEEK_END, '2026-10-20')).toBe(false);
  });

  it('T-GR-5: weeks later — false', () => {
    expect(shouldShowGraceHint(WEEK_END, '2026-11-01')).toBe(false);
  });

  it('T-GR-6: cross-month grace — Sunday', () => {
    // Week ends Sat 2026-10-31, Sunday is 2026-11-01.
    expect(shouldShowGraceHint('2026-10-31', '2026-11-01')).toBe(true);
  });
});