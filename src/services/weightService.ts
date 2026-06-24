import { supabase } from '../lib/supabase';
import { DbWeightLog } from '../types/supabase';
import { authService } from './authService';
import { profileService } from './profileService';
import { calculateBodyFat } from '../lib/navyMethod';

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

  async addWeightLog(logData: Omit<DbWeightLog, 'id' | 'user_id' | 'body_fat'>): Promise<DbWeightLog | null> {
    const userId = await authService.getUserId();
    const profile = await profileService.getProfile();
    
    let bodyFatEstimate = undefined;
    
    // Auto-calculate body fat if measurements exist
    if (profile && profile.height && profile.waist && profile.neck) {
      bodyFatEstimate = calculateBodyFat(
        profile.gender,
        profile.height,
        profile.waist,
        profile.neck,
        profile.hip
      );
    }
    
    const payload = {
      ...logData,
      body_fat: bodyFatEstimate,
      id: crypto.randomUUID(),
      user_id: userId,
    };

    const { data, error } = await supabase
      .from('weight_logs')
      .insert(payload)
      .select()
      .single();
      
    if (error) {
      console.error('Error adding weight log:', error);
      throw error;
    }

    // Update profile weight and goal body fat if calculated
    if (profile) {
      await profileService.upsertProfile({ weight: logData.weight });
      if (bodyFatEstimate) {
        await supabase.from('goals').update({ current_bf: bodyFatEstimate }).eq('user_id', userId);
      }
    }
    
    return data;
  }
};
