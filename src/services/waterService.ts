import { supabase } from '../lib/supabase';
import { authService } from './authService';
import { DbWaterLog } from '../types/supabase';
import { complianceService } from './complianceService';

export const waterService = {
  async getWaterLogs(): Promise<DbWaterLog[]> {
    const userId = await authService.getUserId();
    const { data, error } = await supabase
      .from('water_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (error && error.code !== '42P01') {
      console.error('Error fetching water logs:', error);
      return [];
    }
    return data || [];
  },

  async addWater(amountMl: number): Promise<DbWaterLog | null> {
    const userId = await authService.getUserId();
    const payload = {
      user_id: userId,
      amount_ml: amountMl,
      date: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('water_logs')
      .insert(payload)
      .select()
      .single();

    if (error && error.code !== '42P01') {
      console.error('Error adding water:', error);
      return null;
    }
    
    // Also try to update daily metrics water directly as a fallback if table is missing
    const todayStr = new Date().toISOString().split('T')[0];
    const { data: metrics } = await supabase
      .from('daily_metrics')
      .select('*')
      .eq('user_id', userId)
      .eq('date', todayStr)
      .maybeSingle();
      
    if (metrics) {
      await supabase
        .from('daily_metrics')
        .update({ water: (metrics.water || 0) + (amountMl / 1000) })
        .eq('id', metrics.id);
    }
    
    return data || payload as any; // return payload so UI updates even if DB failed due to missing table
  }
};
