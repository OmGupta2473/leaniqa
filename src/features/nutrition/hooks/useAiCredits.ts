import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/utils/supabase';
import { authService } from '@/features/auth/services/authService';
import { getKolkataDateString } from '@/shared/utils/timezone';
import { subscriptionService } from '@/features/pricing/services/subscriptionService';
import { ENTITLEMENTS } from '@/features/pricing/entitlements';

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
    staleTime: 10_000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const userId = await authService.getUserId();
      const today = getKolkataDateString();

      const [usageResult, subscription] = await Promise.all([
        supabase.rpc('get_api_usage', {
          p_user_id: userId,
          p_endpoint: ENDPOINT,
          p_date: today,
        }),
        subscriptionService.getSubscriptionStatus(),
      ]);

      if (usageResult.error) throw usageResult.error;

      const rows = Array.isArray(usageResult.data)
        ? usageResult.data
        : usageResult.data
        ? [usageResult.data]
        : [];
      const used =
        (rows[0] as { usage_count?: number } | undefined)?.usage_count ?? 0;
      const limit = ENTITLEMENTS[subscription.plan].aiParsesPerDay;

      return { used, limit, remaining: Math.max(0, limit - used) };
    },
  });

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