import { shiftWeek } from '@/shared/utils/weekKey';
import { shiftKolkataDateString } from '@/shared/utils/timezone';

export interface WeekSelectorState {
  prevWeekStart: string | null;
  nextWeekStart: string | null;
  canGoPrev: boolean;
  canGoNext: boolean;
  isCurrentWeek: boolean;
}

/**
 * Pure navigation-state helper for the Weekly Report selector.
 *
 * @param selectedWeekStart  Sunday of the week currently shown.
 * @param currentWeekStart   Sunday of the real-world current week (IST).
 * @param earliestWeekStart  Earliest week the user has any report data for.
 *
 * Bounds:
 *   - prev is disabled at or before earliestWeekStart
 *   - next is disabled at or after currentWeekStart (no future navigation)
 */
export function getWeekSelectorState(
  selectedWeekStart: string,
  currentWeekStart: string,
  earliestWeekStart: string,
): WeekSelectorState {
  const prevWeekStart = shiftWeek(selectedWeekStart, -1);
  const nextWeekStart = shiftWeek(selectedWeekStart, 1);

  // YYYY-MM-DD compares lexically in chronological order.
  const canGoPrev = prevWeekStart >= earliestWeekStart;
  const canGoNext = nextWeekStart <= currentWeekStart;
  const isCurrentWeek = selectedWeekStart === currentWeekStart;

  return {
    prevWeekStart: canGoPrev ? prevWeekStart : null,
    nextWeekStart: canGoNext ? nextWeekStart : null,
    canGoPrev,
    canGoNext,
    isCurrentWeek,
  };
}

/**
 * True on the Sunday or Monday immediately after a completed Saturday.
 * This is the "late logs still count until Monday night" window described in
 * the product concept: any meal edit within it re-triggers calculation for
 * that final week.
 */
export function shouldShowGraceHint(
  weekEnd: string,
  todayIso: string,
): boolean {
  const sundayAfter = shiftKolkataDateString(weekEnd, 1);
  const mondayAfter = shiftKolkataDateString(weekEnd, 2);
  return todayIso === sundayAfter || todayIso === mondayAfter;
}