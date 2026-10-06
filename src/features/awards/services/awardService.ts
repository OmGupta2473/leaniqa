import { supabase } from '@/shared/utils/supabase';
import { authService } from '@/features/auth/services/authService';
import { profileService } from '@/features/profile/services/profileService';
import { mealService } from '@/features/nutrition/services/mealService';
import { weightService } from '@/features/progress/services/weightService';
import { DbUserStreak, DbUserAward, DbDailyMetric } from '@/shared/types/supabase';
import { calculateCurrentDailyStreak, calculateBestDailyStreak } from '@/shared/utils/streaks';
import { evaluateAwards } from '@/shared/utils/awardsEngine';
import { useAwardStore } from '@/features/awards/store/awardStore';
import { getKolkataDateString } from '@/shared/utils/timezone';

export const awardService = {
  async syncStreaksAndAwards(metrics: DbDailyMetric[]): Promise<void> {
    const userId = await authService.getUserId();
    if (!userId || !metrics) return;

    // Persist legacy streak counters. Keep this behavior unchanged.
    const currentStreak = calculateCurrentDailyStreak(metrics);
    const highestStreak = calculateBestDailyStreak(metrics);

    const { error: streakError } = await supabase
      .from('user_streaks')
      .upsert(
        {
          user_id: userId,
          current_streak: currentStreak,
          highest_streak: highestStreak,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );

    if (streakError) {
      if (
        !streakError.message?.includes('404') &&
        streakError.code !== 'PGRST116' &&
        !streakError.code?.startsWith('PGRST20')
      ) {
        console.error('Error syncing user_streaks:', streakError);
      }
    }

    // Fetch every input needed by the 22-award engine.
    const [mealLogs, weightLogs, profile, existingAwards] = await Promise.all([
      mealService.getMeals({ days: 365, limit: 2000 }).catch(() => []),
      weightService.getWeightLogs().catch(() => []),
      profileService.getProfile().catch(() => null),
      supabase
        .from('user_awards')
        .select('*')
        .eq('user_id', userId)
        .then((result) => result.data ?? []),
    ]);

    // newlyEligible means: rule satisfied but no user_awards row exists.
    const evaluation = evaluateAwards({
      metrics,
      mealLogs,
      weightLogs,
      profileCreatedAt: profile?.created_at ?? null,
      todayIso: getKolkataDateString(),
      unlockedAwards: existingAwards,
    });

    // Never delete or overwrite legacy awards. Insert only IDs absent from
    // user_awards. The unique (user_id, award_id) conflict target makes
    // this safe if two syncs happen concurrently.
    if (evaluation.newlyEligible.length > 0) {
      const rows = evaluation.newlyEligible.map((id) => ({
        user_id: userId,
        award_id: id,
        unlocked_at: new Date().toISOString(),
      }));

      const { error: awardsError } = await supabase
        .from('user_awards')
        .upsert(rows, {
          onConflict: 'user_id,award_id',
          ignoreDuplicates: true,
        });

      if (awardsError) {
        if (
          !awardsError.message?.includes('404') &&
          awardsError.code !== 'PGRST116' &&
          !awardsError.code?.startsWith('PGRST20')
        ) {
          console.error('Error inserting user_awards:', awardsError);
        }
      } else {
        // Header's small red dot is an event signal, not an expensive
        // re-evaluation on every route/render.
        useAwardStore.getState().setHasUnseenAwards(true);
      }
    }
  },

  async getUserStreak(): Promise<DbUserStreak | null> {
    const userId = await authService.getUserId();

    const { data } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    return data;
  },

  async getUserAwards(): Promise<DbUserAward[]> {
    const userId = await authService.getUserId();

    const { data } = await supabase
      .from('user_awards')
      .select('*')
      .eq('user_id', userId);

    return data || [];
  },
};