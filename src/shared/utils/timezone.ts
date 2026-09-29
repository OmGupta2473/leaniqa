export const KOLKATA_OFFSET_MINUTES = 5 * 60 + 30;

/**
 * IST calendar date (YYYY-MM-DD) of a given instant, in any host timezone.
 */
export function getKolkataDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * UTC ISO string for 00:00:00.000 IST on the IST calendar day containing `date`.
 */
export function getKolkataStartOfDay(date: Date = new Date()): string {
  return istWallTimeToUtcIso(getKolkataDateString(date), 0, 0, 0, 0);
}

/**
 * UTC ISO string for 23:59:59.999 IST on the IST calendar day containing `date`.
 */
export function getKolkataEndOfDay(date: Date = new Date()): string {
  return istWallTimeToUtcIso(getKolkataDateString(date), 23, 59, 59, 999);
}

/**
 * Given a YYYY-MM-DD IST calendar date, returns the UTC instant of 00:00 IST that day.
 */
export function kolkataDateStringToUtcMidnight(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0) - KOLKATA_OFFSET_MINUTES * 60 * 1000);
}

/**
 * Shifts a YYYY-MM-DD IST calendar date by `days` (negative for past) using string arithmetic.
 */
export function shiftKolkataDateString(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/**
 * Milliseconds elapsed since IST midnight for the IST day containing `date`.
 * Range: [0, 86_400_000).
 */
export function msSinceKolkataMidnight(date: Date = new Date()): number {
  const dateStr = getKolkataDateString(date);
  const midnightUtc = kolkataDateStringToUtcMidnight(dateStr);
  return date.getTime() - midnightUtc.getTime();
}

/**
 * Hour of day in IST (0–23) for the given instant.
 */
export function getKolkataHour(date: Date = new Date()): number {
  return Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      hour12: false,
    }).format(date),
  );
}

/**
 * Convert IST wall-clock (date + h/m/s/ms) to a UTC ISO instant.
 * Not exported; used internally.
 */
function istWallTimeToUtcIso(
  dateStr: string,
  h: number,
  m: number,
  s: number,
  ms: number,
): string {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const utcMs =
    Date.UTC(y, mo - 1, d, h, m, s, ms) - KOLKATA_OFFSET_MINUTES * 60 * 1000;
  return new Date(utcMs).toISOString();
}