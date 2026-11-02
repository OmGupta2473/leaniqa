import { queryClient } from '@/app/query/queryClient';
import { complianceService } from '@/features/reports/services/complianceService';
import { weeklyReportService } from '@/features/reports/services/weeklyReportService';
import { getWeekStart } from '@/shared/utils/weekKey';

export const onMealSaved = async (dateKeyStr: string) => {
  console.log('[Sync] unified onMealSaved triggered for', dateKeyStr);

  await queryClient.invalidateQueries({ queryKey: ["meals"] });

  try {
    await complianceService.recalculateDayScore(dateKeyStr);
  } catch (e) {
    console.error("[Sync] Failed to recalculate day score", e);
  }

  try {
    await weeklyReportService.upsertWeek(getWeekStart(dateKeyStr));
  } catch (err) {
    const code = (err as { code?: string })?.code ?? 'unknown';
    console.error('[weeklyReportService] upsertWeek failed', {
      weekStart: getWeekStart(dateKeyStr),
      code,
    });
  }

  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["dailyMetrics"] }),
    queryClient.invalidateQueries({ queryKey: ["complianceScore"] }),
    queryClient.invalidateQueries({ queryKey: ["complianceScores"] }),
    queryClient.invalidateQueries({ queryKey: ["userStreak"] }),
    queryClient.invalidateQueries({ queryKey: ["userAwards"] }),
    // Weekly Report page reads from weekly_reports (persisted), the live
    // week engine, and the raw meal rows. All three sources just changed.
    // Prefix invalidation covers:
    //   ['weeklyReport', <weekStart>]
    //   ['weeklyReport', 'previous', <weekStart>]
    //   ['weeklyReports', 'list']
    //   ['liveWeekReport', <weekStart>]
    //   ['trendData', 7] and ['trendData', 30]
    queryClient.invalidateQueries({ queryKey: ["weeklyReport"] }),
    queryClient.invalidateQueries({ queryKey: ["weeklyReports"] }),
    queryClient.invalidateQueries({ queryKey: ["liveWeekReport"] }),
    queryClient.invalidateQueries({ queryKey: ["trendData"] }),
    queryClient.invalidateQueries({ queryKey: ["mealCount"] }),
  ]);
};