import { shiftKolkataDateString } from './timezone';

/**
 * Given an IST calendar date (YYYY-MM-DD), returns the IST date of the Sunday
 * on or before it. Example: '2026-10-12' (Mon) -> '2026-10-11' (Sun).
 */
export function getWeekStart(istDate: string): string {
  const [y, m, d] = istDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dayOfWeek = dt.getUTCDay(); // 0 = Sun .. 6 = Sat
  const daysToSubtract = dayOfWeek; // 0 for Sun, 1 for Mon, etc.
  return shiftKolkataDateString(istDate, -daysToSubtract);
}

/**
 * Given a weekStart (Sunday), returns the Saturday 6 days later.
 * Example: '2026-10-11' -> '2026-10-17'.
 */
export function getWeekEnd(weekStart: string): string {
  return shiftKolkataDateString(weekStart, 6);
}

/**
 * Shifts a weekStart by n weeks. n may be negative.
 */
export function shiftWeek(weekStart: string, n: number): string {
  return shiftKolkataDateString(weekStart, n * 7);
}

/**
 * Returns all 7 IST date keys for the week, in order Sun..Sat.
 */
export function getWeekDays(weekStart: string): string[] {
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(shiftKolkataDateString(weekStart, i));
  }
  return days;
}

/**
 * Human-readable week label. Example: 'Oct 4 – Oct 10, 2026'.
 */
export function getWeekLabel(weekStart: string): string {
  const weekEnd = getWeekEnd(weekStart);
  const [y1, m1, d1] = weekStart.split('-').map(Number);
  const [y2, m2, d2] = weekEnd.split('-').map(Number);

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  if (y1 !== y2) {
    return `${monthNames[m1 - 1]} ${d1}, ${y1} – ${monthNames[m2 - 1]} ${d2}, ${y2}`;
  }
  return `${monthNames[m1 - 1]} ${d1} – ${monthNames[m2 - 1]} ${d2}, ${y1}`;
}

/**
 * Status of the report for the week containing `weekEnd`, given the current
 * IST calendar date (`nowIsoDate`). Once `nowIsoDate` is past `weekEnd`,
 * the week is final. Late-log recalc is a Phase 2 write-path concern.
 */
export function computeWeekStatus(weekEnd: string, nowIsoDate: string): 'live' | 'final' {
  return nowIsoDate <= weekEnd ? 'live' : 'final';
}