import { useQuery } from '@tanstack/react-query';
import { mealService } from '@/features/nutrition/services/mealService';
import { weightService } from '@/features/progress/services/weightService';
import { profileService } from '@/features/profile/services/profileService';
import { computeWeeklyReport } from '@/shared/utils/weeklyEngine';
import { getWeekEnd } from '@/shared/utils/weekKey';
import { getKolkataDateString, kolkataDateStringToUtcMidnight, shiftKolkataDateString } from '@/shared/utils/timezone';
import type { DbWeeklyReport, WeeklyDaySummary } from '@/shared/types/supabase';

/**
 * Compute the current live week's report on the client, fresh from meals +
 * weight logs + current profile targets. Unlike the persisted weekly_reports
 * row, this always reflects what has actually been logged. Only for the
 * current live week; historical weeks read from the DB snapshot.
 *
 * Returns null when the user has no complete targets (mirrors upsertWeek's
 * skip rule) or on any fetch error. The page falls back to the persisted
 * row in that case.
 */
export function useLiveWeekReport(weekStart: string, enabled: boolean) {
  return useQuery<DbWeeklyReport | null>({
    queryKey: ['liveWeekReport', weekStart],
    enabled,
    staleTime: 30_000,
    queryFn: async () => {
      const weekEnd = getWeekEnd(weekStart);
      const startInstant = kolkataDateStringToUtcMidnight(weekStart).toISOString();
      const dayAfter = shiftKolkataDateString(weekEnd, 1);
      const endExclusive = kolkataDateStringToUtcMidnight(dayAfter).toISOString();

      const [meals, weightLogs, profile] = await Promise.all([
        mealService.getMealsInRange(startInstant, endExclusive),
        weightService.getWeightLogs(),
        profileService.getProfile(),
      ]);

      if (!profile) return null;
      const { target_kcal, protein_target, carbs_target, fat_target } = profile;
      if (
        target_kcal == null ||
        protein_target == null ||
        carbs_target == null ||
        fat_target == null
      ) {
        return null;
      }

      const weekWeightLogs = weightLogs.filter(
        (w) => w.date >= weekStart && w.date <= weekEnd,
      );

      const result = computeWeeklyReport({
        weekStart,
        weekEnd,
        nowIsoDate: getKolkataDateString(),
        meals,
        weightLogs: weekWeightLogs,
        targets: {
          calories: target_kcal,
          protein: protein_target,
          carbs: carbs_target,
          fat: fat_target,
        },
      });

      const now = new Date().toISOString();
      return {
        user_id: profile.id ?? '',
        week_start: result.weekStartDate,
        week_end: result.weekEndDate,
        status: 'live',
        days_with_meals: result.daysWithMeals,
        days_with_weight: result.daysWithWeight,
        total_calories: result.totalCalories,
        avg_calories: result.avgCalories,
        target_calories: result.targetCalories,
        total_protein_g: result.totalProteinG,
        avg_protein_g: result.avgProteinG,
        target_protein_g: result.targetProteinG,
        total_carbs_g: result.totalCarbsG,
        avg_carbs_g: result.avgCarbsG,
        target_carbs_g: result.targetCarbsG,
        total_fat_g: result.totalFatG,
        avg_fat_g: result.avgFatG,
        target_fat_g: result.targetFatG,
        weekly_score: result.weeklyScore,
        confidence: result.confidence,
        day_summaries: result.daySummaries as WeeklyDaySummary[],
        computed_at: now,
        finalized_at: null,
        created_at: now,
        updated_at: now,
      } satisfies DbWeeklyReport;
    },
  });
}