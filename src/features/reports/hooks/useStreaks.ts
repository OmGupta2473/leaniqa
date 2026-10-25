import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/utils/supabase';
import { authService } from '@/features/auth/services/authService';
import { shiftKolkataDateString, getKolkataDateString } from '@/shared/utils/timezone';
import { getStreaks, type StreakResult } from '@/shared/utils/weeklyEngine';

interface UseStreaksOptions {
  enabled?: boolean;
}

export function useStreaks({ enabled = true }: UseStreaksOptions = {}) {
  return useQuery({
    queryKey: ['streaks'],
    queryFn: async (): Promise<StreakResult | null> => {
      const userId = await authService.getUserId();
      const today = getKolkataDateString();

      // Fetch last 90 days of daily_metrics + today
      const startDate = shiftKolkataDateString(today, -90);

      const { data: metrics, error } = await supabase
        .from('daily_metrics')
        .select('date, target_calories, actual_calories, target_protein, actual_protein')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', today);

      if (error) throw error;

      // Fetch profile for current targets (fallback)
      const { data: profile } = await supabase
        .from('profiles')
        .select('target_kcal, protein_target')
        .eq('id', userId)
        .maybeSingle();

      const targets = {
        calories: profile?.target_kcal ?? 2000,
        protein: profile?.protein_target ?? 150,
      };

      return getStreaks(metrics ?? [], today, targets);
    },
    enabled,
    staleTime: 60_000, // 1 minute
  });
}