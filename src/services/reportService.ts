import { supabase } from '../lib/supabase';
import { DbWeeklyReport, DbDailyMetric } from '../types/supabase';
import { authService } from './authService';

export const reportService = {
  async getWeeklyReports(): Promise<DbWeeklyReport[]> {
    const userId = await authService.getUserId();
    const { data, error } = await supabase
      .from('weekly_reports')
      .select('*')
      .eq('user_id', userId)
      .order('week_start', { ascending: false });
      
    if (error) {
      console.error('Error fetching weekly reports:', error);
      return [];
    }
    return data || [];
  },
  
  async getDailyMetrics(): Promise<DbDailyMetric[]> {
    const userId = await authService.getUserId();
    const { data, error } = await supabase
      .from('daily_metrics')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });
      
    if (error) {
      console.error('Error fetching daily metrics:', error);
      return [];
    }
    return data || [];
  }
};
