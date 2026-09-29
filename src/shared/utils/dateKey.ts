/**
 * Date-key helpers, IST-based (Asia/Kolkata). See timezone.ts for the primitives.
 * formatDateKey(instant) returns the IST calendar day as YYYY-MM-DD.
 * parseDateKey('YYYY-MM-DD') returns the UTC instant of IST midnight that day.
 */
export { getKolkataDateString as formatDateKey } from './timezone';
export { kolkataDateStringToUtcMidnight as parseDateKey } from './timezone';
