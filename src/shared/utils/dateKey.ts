/**
 * Formats a Date as a canonical YYYY-MM-DD date key (padded).
 * Uses the browser's local time. Timezone centralization is a separate change (Stage C);
 * this helper exists so meal query keys are consistent across the app.
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a YYYY-MM-DD date key back to a Date at local midnight.
 * Tolerates both padded and un-padded month/day for backward compatibility with
 * any persisted values written by an earlier version.
 */
export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}
