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
  },

  async saveWeeklyReport(weekStart: string, reportData: any): Promise<DbWeeklyReport | null> {
    const userId = await authService.getUserId();
    
    // Check if exists
    const { data: existing } = await supabase
      .from('weekly_reports')
      .select('id')
      .eq('user_id', userId)
      .eq('week_start', weekStart)
      .maybeSingle();

    const payload = {
      id: existing?.id || crypto.randomUUID(),
      user_id: userId,
      week_start: weekStart,
      report: JSON.stringify(reportData)
    };

    const { data, error } = await supabase
      .from('weekly_reports')
      .upsert(payload)
      .select()
      .single();

    if (error) {
      console.error('Error saving weekly report:', error);
      return null;
    }
    return data;
  }
};
