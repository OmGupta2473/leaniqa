import { queryClient } from '@/app/query/queryClient';
import { complianceService } from '@/features/reports/services/complianceService';

export const onMealSaved = async (dateKeyStr: string) => {
  console.log('[Sync] unified onMealSaved triggered for', dateKeyStr);
  
  // 1. Instantly invalidate all queries relating to meals so they refetch next time
  await queryClient.invalidateQueries({ queryKey: ["meals"] });

  // 2. We MUST recalculate the day score immediately for compliance/streaks
  try {
    await complianceService.recalculateDayScore(dateKeyStr);
  } catch(e) {
    console.error("[Sync] Failed to recalculate day score", e);
  }

  // 3. Invalidate derived reporting queries
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["dailyMetrics"] }),
    queryClient.invalidateQueries({ queryKey: ["complianceScore"] }),
    queryClient.invalidateQueries({ queryKey: ["complianceScores"] }),
    queryClient.invalidateQueries({ queryKey: ["userStreak"] }),
    queryClient.invalidateQueries({ queryKey: ["userAwards"] })
  ]);
};
