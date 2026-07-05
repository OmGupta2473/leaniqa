import { queryClient } from '@/app/query/queryClient';
import { supabase } from '@/shared/utils/supabase';
import { DbWeightLog } from '@/shared/types/supabase';
import { authService } from '@/features/auth';
import { profileService } from '@/features/profile';
import { calculateBodyFat } from '@/shared/utils/navyMethod';

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
      return [];
    }
    return data || [];
  },

  async addWeightLog(logData: Omit<DbWeightLog, 'id' | 'user_id' | 'body_fat'>, measurementsUpdated: boolean = false): Promise<DbWeightLog | null> {
    const userId = await authService.getUserId();
    let profile = queryClient.getQueryData<any>(['profile']);
    if (!profile) profile = await queryClient.fetchQuery({ queryKey: ['profile'], queryFn: () => profileService.getProfile() });
    
    let bodyFatEstimate = undefined;
    
    // Auto-calculate body fat if measurements exist
    if (measurementsUpdated && profile && profile.height && profile.waist && profile.neck) {
      const rawEstimate = calculateBodyFat(
        profile.gender,
        profile.height,
        profile.waist,
        profile.neck,
        profile.hip
      );
      bodyFatEstimate = Math.max(3, Math.min(60, Math.round(rawEstimate * 10) / 10));
    }
    
    const payload = {
      ...logData,
      body_fat: bodyFatEstimate,
      user_id: userId,
    };

    const { data, error } = await supabase
      .from('weight_logs')
      .insert(payload)
      .select()
      .maybeSingle();
      
    if (error && error.code !== 'PGRST116') {
      console.error('Error adding weight log:', error);
      throw error;
    }

    const returnedData = data || payload;

    // Update profile weight and goal body fat if calculated
    if (profile) {
      await profileService.upsertProfile({ weight: logData.weight });
      if (bodyFatEstimate) {
        await supabase.from('goals').update({ current_bf: bodyFatEstimate }).eq('user_id', userId);
      }
    }
    
    return returnedData;
  }
};
