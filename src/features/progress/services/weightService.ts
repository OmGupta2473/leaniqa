import { queryClient } from '@/app/query/queryClient';
import { supabase } from '@/shared/utils/supabase';
import { DbWeightLog } from '@/shared/types/supabase';
import { authService } from '@/features/auth/services/authService';
import { profileService } from '@/features/profile/services/profileService';
import { calculateBodyFat } from '@/shared/utils/navyMethod';
import { getKolkataDateString } from '@/shared/utils/timezone';

export const weightService = {
  async getWeightLogs(): Promise<DbWeightLog[]> {
    const userId = await authService.getUserId();
    const { data, error } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });
      
    if (error) {
      console.error('Error fetching weight logs:', error);
      throw error;
    }
    return data || [];
  },

    async addWeightLog(
    logData: Omit<DbWeightLog, 'id' | 'user_id' | 'body_fat'>,
    measurementsUpdated: boolean = false
  ): Promise<DbWeightLog | null> {
    const userId = await authService.getUserId();

    // When measurementsUpdated is true, the caller has just written new
    // waist / neck / hip / height via updateProfile. But the ['profile']
    // cache still holds pre-update values. Reading from cache here would
    // compute body_fat from stale data on the very log that was supposed to
    // use the new measurements. Read directly from the DB to guarantee
    // freshness. This also fixes the offline-flush caller
    // (offlineSyncService), which does the same updateProfile → addWeightLog
    // sequence.
    let profile: any;
    if (measurementsUpdated) {
      const { data: freshProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      profile = freshProfile;
    } else {
      profile = queryClient.getQueryData<any>(['profile'])
        || await queryClient.fetchQuery({
          queryKey: ['profile'],
          queryFn: () => profileService.getProfile(),
        });
    }

    let bodyFatEstimate = undefined;
    if (measurementsUpdated && profile && profile.height && profile.waist && profile.neck) {
      const rawEstimate = calculateBodyFat(
        profile.gender,
        profile.height,
        profile.waist,
        profile.neck,
        profile.hip
      );
      if (Number.isFinite(rawEstimate)) {
        bodyFatEstimate = Math.max(3, Math.min(60, Math.round(rawEstimate * 10) / 10));
      }
    }

    const payload = {
      ...logData,
      body_fat: bodyFatEstimate,
      user_id: userId,
    };

    const dateValue = logData.date;
    const datePrefix = dateValue.includes('T')
      ? getKolkataDateString(new Date(dateValue))
      : dateValue;
    const upsertPayload = { ...payload, date: datePrefix };

    const { data, error } = await supabase
      .from('weight_logs')
      .upsert(upsertPayload, { onConflict: 'user_id,date' })
      .select()
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error adding weight log:', error);
      throw error;
    }

    const returnedData = data || payload;

    if (profile) {
      const promises: Promise<any>[] = [
        profileService.updateProfile({ weight: logData.weight })
      ];
      if (bodyFatEstimate) {
        promises.push(supabase.from("goals").update({ current_bf: bodyFatEstimate }).eq("user_id", userId) as any);
      }
      await Promise.all(promises);
    }

    return returnedData;
  }
};
