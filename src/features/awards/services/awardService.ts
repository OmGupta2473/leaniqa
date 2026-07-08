import { supabase } from '@/shared/utils/supabase';
import { authService } from '@/features/auth/services/authService';
import { DbUserStreak, DbUserAward, DbDailyMetric } from '@/shared/types/supabase';
import { calculateCurrentDailyStreak, calculateBestDailyStreak, AWARDS_CATALOG } from '@/shared/utils/streaks';

export const awardService = {
  async syncStreaksAndAwards(metrics: DbDailyMetric[]): Promise<void> {
    const userId = await authService.getUserId();
    if (!userId || !metrics) return;

    const currentStreak = calculateCurrentDailyStreak(metrics);
    const highestStreak = calculateBestDailyStreak(metrics);

    // Update user_streaks
    const { error: streakError } = await supabase
      .from('user_streaks')
      .upsert(
        { user_id: userId, current_streak: currentStreak, highest_streak: highestStreak, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
    
    if (streakError) {
      console.error('Error syncing user_streaks:', streakError);
    }

    // Determine newly unlocked awards
    const newlyUnlocked = AWARDS_CATALOG.filter(a => highestStreak >= a.streakRequired);
    
    // Fetch existing awards
    const { data: existingAwards } = await supabase
      .from('user_awards')
      .select('award_id')
      .eq('user_id', userId);
      
    const existingIds = new Set((existingAwards || []).map(a => a.award_id));
    
    const awardsToInsert = newlyUnlocked
      .filter(a => !existingIds.has(a.id))
      .map(a => ({
        user_id: userId,
        award_id: a.id,
        unlocked_at: new Date().toISOString()
      }));
      
    if (awardsToInsert.length > 0) {
      const { error: awardsError } = await supabase
        .from('user_awards')
        .insert(awardsToInsert);
        
      if (awardsError) {
        console.error('Error inserting user_awards:', awardsError);
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
  }
};
