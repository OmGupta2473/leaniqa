import { supabase } from '@/shared/utils/supabase';
import { DbWeeklyReport, DbDailyMetric } from '@/shared/types/supabase';
import { authService } from '@/features/auth/services/authService';

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
      throw error;
    }
    return data || [];
  },
  
  async getDailyMetrics(): Promise<DbDailyMetric[]> {
    const userId = await authService.getUserId();
    // 2000 rows ≈ 5.5 years of daily data. Every current consumer caps its
    // own window to 90 days (streaks, awards) or the last N weeks (reports),
    // so this limit is a safety ceiling against unbounded history growth, not
    // a semantic cap. If a user exceeds it, they are an outlier and the data
    // can be fetched in a targeted follow-up query.
    const { data, error } = await supabase
      .from('daily_metrics')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true })
      .limit(2000);
      
    if (error) {
      console.error('Error fetching daily metrics:', error);
      throw error;
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

    const payload: any = {
      user_id: userId,
      week_start: weekStart,
      report: JSON.stringify(reportData)
    };
    if (existing?.id) {
      payload.id = existing.id;
    }

    const { data, error } = await supabase
      .from('weekly_reports')
      .upsert(payload)
      .select()
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error saving weekly report:', error);
      throw error;
    }
    return data || payload;
  }
};
