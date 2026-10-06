import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/features/reports/services/reportService';
import { awardService } from '@/features/awards/services/awardService';
import { useAwardStore } from '@/features/awards/store/awardStore';
import { useAuthSession } from '@/router/useAuthSession';

/**
 * Fires syncStreaksAndAwards once per authenticated session, then
 * hydrates the celebration queue and header flag from DB.
 *
 * Runs after the auth session resolves AND the metrics query resolves,
 * so it never triggers on a null session or an empty dataset.
 */
export function useAwardsSync() {
  const { session } = useAuthSession();
  const userId = session?.user?.id ?? null;
  const lastSyncedUserRef = useRef<string | null>(null);

  const { data: metrics } = useQuery({
    queryKey: ['dailyMetrics'],
    queryFn: () => reportService.getDailyMetrics(),
    enabled: !!userId,
  });

  useEffect(() => {
    if (!userId || !metrics) return;
    if (lastSyncedUserRef.current === userId) return;
    lastSyncedUserRef.current = userId;

    let cancelled = false;
    (async () => {
      try {
        await awardService.syncStreaksAndAwards(metrics);
      } catch (err) {
        console.error('[useAwardsSync] sync failed:', err);
      }
      try {
        const unack = await awardService.getUnacknowledgedAwards();
        if (cancelled) return;
        useAwardStore.getState().setPendingCelebrations(unack);
        useAwardStore.getState().setHasUnseenAwards(unack.length > 0);
      } catch (err) {
        console.error('[useAwardsSync] hydrate failed:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, metrics]);
}