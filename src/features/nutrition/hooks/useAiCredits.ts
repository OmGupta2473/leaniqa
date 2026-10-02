import { useQuery } from '@tanstack/react-query';
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
  const query = useQuery<AiCredits>({
    queryKey: ['aiCredits'],
    staleTime: 60_000,
    queryFn: async () => {
      const userId = await authService.getUserId();
      const today = getKolkataDateString();
      const [{ data: usageData, error: usageError }, limit] = await Promise.all([
        supabase.rpc('get_api_usage', { p_user_id: userId, p_endpoint: ENDPOINT, p_date: today }),
        Promise.resolve(15), // v1: hardcoded default; replace when limit is exposed via env
      ]);
      if (usageError) throw usageError;
      const rows = Array.isArray(usageData) ? usageData : usageData ? [usageData] : [];
      const used = (rows[0] as { usage_count?: number } | undefined)?.usage_count ?? 0;
      return { used, limit, remaining: Math.max(0, limit - used) };
    },
  });
  return {
    credits: query.data,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
