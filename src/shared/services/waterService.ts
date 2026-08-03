import { supabase } from '@/shared/utils/supabase';
import { authService } from '@/features/auth/services/authService';
import { DbWaterLog } from '@/shared/types/supabase';
import { complianceService } from '@/features/reports/services/complianceService';

export const waterService = {
  async getWaterLogs(): Promise<DbWaterLog[]> {
    const userId = await authService.getUserId();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const { data, error } = await supabase
      .from('water_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startOfToday)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching water logs:', error);
      return [];
    }
    return data || [];
  },

  async getTodaysWaterTotal(): Promise<number> {
    const logs = await this.getWaterLogs();
    return logs.reduce((acc, w) => acc + w.amount_ml, 0);
  },

  async addWater(amountMl: number): Promise<DbWaterLog | null> {
    const [userId, previousTotalMl] = await Promise.all([
      authService.getUserId(),
      this.getTodaysWaterTotal()
    ]);

    const payload = {
      user_id: userId,
      amount_ml: amountMl,
      date: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('water_logs')
      .insert(payload)
      .select()
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error adding water:', error);
      return null;
    }
    
    const newTotalLiters = (previousTotalMl + amountMl) / 1000;
    await complianceService.updateTodayScore();
    
    return data || payload;
  }
};
