import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/utils/supabase';
import { authService } from '@/features/auth/services/authService';
import { shiftKolkataDateString, getKolkataDateString, kolkataDateStringToUtcMidnight } from '@/shared/utils/timezone';
import { getTrendData, type TrendDataResult } from '@/shared/utils/weeklyEngine';

interface UseTrendDataOptions {
  days: 7 | 30;
  enabled?: boolean;
}

export function useTrendData({ days, enabled = true }: UseTrendDataOptions) {
  return useQuery({
    queryKey: ['trendData', days],
    queryFn: async (): Promise<TrendDataResult | null> => {
      const userId = await authService.getUserId();
      const endDate = getKolkataDateString();

      // Calculate start date for meal fetch
      const startDate = shiftKolkataDateString(endDate, -(days - 1));

      // Fetch meals
      const { data: meals, error } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('meal_time', kolkataDateStringToUtcMidnight(startDate).toISOString())
        .lt('meal_time', kolkataDateStringToUtcMidnight(shiftKolkataDateString(endDate, 1)).toISOString());

      if (error) throw error;

      // Fetch profile for targets
      const { data: profile } = await supabase
        .from('profiles')
        .select('target_kcal, protein_target')
        .eq('id', userId)
        .maybeSingle();

      const targets = {
        calories: profile?.target_kcal ?? 2000,
        protein: profile?.protein_target ?? 150,
      };

      return getTrendData(meals ?? [], endDate, days, targets);
    },
    enabled,
    staleTime: 60_000, // 1 minute
  });
}