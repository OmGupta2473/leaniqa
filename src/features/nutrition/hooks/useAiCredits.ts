import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/utils/supabase';
import { authService } from '@/features/auth/services/authService';
import { getKolkataDateString } from '@/shared/utils/timezone';

const ENDPOINT = 'parse-meal';

export interface AiCredits {
  used: number;
  limit: number;
  remaining: number;
}

export function useAiCredits() {
  const queryClient = useQueryClient();
  const query = useQuery<AiCredits>({
    queryKey: ['aiCredits'],
    staleTime: 10_000,          // keep in sync with refetchOnMount: 'always'
    refetchOnMount: 'always',   // re-read the DB whenever the meal logger mounts
    refetchOnWindowFocus: true, // correct the counter when the user returns to the tab
    queryFn: async () => {
      const userId = await authService.getUserId();
      const today = getKolkataDateString();
      const { data: usageData, error: usageError } = await supabase.rpc('get_api_usage', {
        p_user_id: userId,
        p_endpoint: ENDPOINT,
        p_date: today,
      });
      if (usageError) throw usageError;
      const rows = Array.isArray(usageData) ? usageData : usageData ? [usageData] : [];
      const used = (rows[0] as { usage_count?: number } | undefined)?.usage_count ?? 0;
      return { used, limit: 5, remaining: Math.max(0, 5 - used) };
    },
  });

  // Invalidate first: that drops the cached (possibly still-"fresh") snapshot and
  // bypasses React Query's dedup guard which was swallowing the update. Then
  // force a fetch that cancels any in-flight request, so the value we resolve
  // with is always the post-refund one.
  const refetch = async () => {
    await queryClient.invalidateQueries({ queryKey: ['aiCredits'], exact: true });
    return query.refetch({ cancelRefetch: true });
  };

  return {
    credits: query.data,
    isLoading: query.isLoading,
    refetch,
  };
}
