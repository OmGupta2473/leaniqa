import { weeklyReportService } from '../services/weeklyReportService';
import { getWeekStart } from '@/shared/utils/weekKey';
import { getKolkataDateString } from '@/shared/utils/timezone';

/**
 * Recalculate the CURRENT live week's report against fresh profile targets.
 * Called after any user action that changes target_kcal, protein_target,
 * carbs_target, or fat_target. Historical weeks are deliberately not touched:
 * they keep their snapshot from when they were finalized.
 *
 * Fire-and-forget. A failed recalc leaves the row stale until the next meal
 * save, which triggers the same path. Errors are logged with a code, never
 * with row contents.
 */
export function syncCurrentWeekReport(): void {
  const weekStart = getWeekStart(getKolkataDateString());
  void weeklyReportService.upsertWeek(weekStart).catch((err) => {
    const code = (err as { code?: string })?.code ?? 'unknown';
    console.error('[weeklyReportService] syncCurrentWeekReport failed', {
      weekStart,
      code,
    });
  });
}