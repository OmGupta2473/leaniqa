import { supabase } from '../lib/supabase';
import { DbWeightLog } from '../types/supabase';
import { authService } from './authService';

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

  async addWeightLog(logData: Omit<DbWeightLog, 'id' | 'user_id'>): Promise<DbWeightLog | null> {
    const userId = await authService.getUserId();
    const payload = {
      ...logData,
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
    return data;
  }
};
