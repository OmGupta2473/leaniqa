import { queryClient } from '@/app/query/queryClient';
import { supabase } from '@/shared/utils/supabase';
import { calculateDailyScore } from '@/shared/utils/complianceEngine';
import { mealService } from '@/features/nutrition/services/mealService';
import { weightService } from '@/features/progress/services/weightService';
import { profileService } from '@/features/profile/services/profileService';
import { reportService } from './reportService';
import { authService } from '@/features/auth/services/authService';
import { DbDailyMetric } from '@/shared/types/supabase';

function getLocalDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const complianceService = {
  
  async recalculateDayScore(dateStr: string): Promise<DbDailyMetric | null> {
    try {
      const [userId, profile, goal, meals, weightLogs] = await Promise.all([
        authService.getUserId(),
        queryClient.getQueryData<any>(['profile']) || queryClient.fetchQuery({ queryKey: ['profile'], queryFn: () => profileService.getProfile() }),
        queryClient.getQueryData<any>(['goal']) || queryClient.fetchQuery({ queryKey: ['goal'], queryFn: () => profileService.getGoal() }),
        mealService.getMealsByDate(dateStr),
        queryClient.getQueryData<any[]>(['weightLogs']) || queryClient.fetchQuery({ queryKey: ['weightLogs'], queryFn: () => weightService.getWeightLogs() })
      ]);
      
      if (!profile) return null;
      
                  
      const hasWeightLogged = weightLogs.some((w: any) => w.date.startsWith(dateStr));
      let actualCalories = 0;
      meals.forEach((m: any) => actualCalories += m.calories);
      let actualProtein = 0;
      meals.forEach((m: any) => actualProtein += m.protein);
      
      const targetCalories = (profile.maintenance_kcal || 2200) - (goal?.deficit_kcal ?? 400);
      const targetProtein = profile.protein_target || 150;
      
      const score = calculateDailyScore({
        targetCalories,
        actualCalories,
        targetProtein,
        actualProtein,
        hasWeightLogged,
        
      });
      
      const metricPayload = {
        date: dateStr,
        target_calories: targetCalories,
        actual_calories: actualCalories,
        target_protein: targetProtein,
        actual_protein: actualProtein,
        score
      };
      
      const payload: any = {
        ...metricPayload,
        user_id: userId,
      };
      
      const { data, error } = await supabase
        .from('daily_metrics')
        .upsert(payload, { onConflict: 'user_id,date' })
        .select()
        .maybeSingle();
        
      try {
        const allMetrics = await reportService.getDailyMetrics();
        const { awardService } = await import('@/features/awards/services/awardService');
        await awardService.syncStreaksAndAwards(allMetrics);
      } catch (err) {
        console.error('Error syncing awards:', err);
      }
      
      return data || payload;
    } catch (e) {
      console.error('Compliance service error:', e);
      return null;
    }
  },
  async updateTodayScore(): Promise<DbDailyMetric | null> {
    try {
      const [userId, profile, goal, meals, weightLogs] = await Promise.all([
        authService.getUserId(),
        queryClient.getQueryData<any>(['profile']) || queryClient.fetchQuery({ queryKey: ['profile'], queryFn: () => profileService.getProfile() }),
        queryClient.getQueryData<any>(['goal']) || queryClient.fetchQuery({ queryKey: ['goal'], queryFn: () => profileService.getGoal() }),
        queryClient.getQueryData<any[]>(['meals', 'today']) || queryClient.fetchQuery({ queryKey: ['meals', 'today'], queryFn: () => mealService.getTodaysMeals() }),
        queryClient.getQueryData<any[]>(['weightLogs']) || queryClient.fetchQuery({ queryKey: ['weightLogs'], queryFn: () => weightService.getWeightLogs() })
      ]);
      
      if (!profile) return null;
      
      const today = getLocalDateString();
                  
      const hasWeightLogged = weightLogs.some(w => w.date.startsWith(today));
      let actualCalories = 0;
      meals.forEach((m: any) => actualCalories += m.calories);
      let actualProtein = 0;
      meals.forEach((m: any) => actualProtein += m.protein);
      
      const targetCalories = (profile.maintenance_kcal || 2200) - (goal?.deficit_kcal ?? 400);
      const targetProtein = profile.protein_target || 150;
      
      const score = calculateDailyScore({
        targetCalories,
        actualCalories,
        targetProtein,
        actualProtein,
        hasWeightLogged,
        
      });
      
      const metricPayload = {
        date: today,
        target_calories: targetCalories,
        actual_calories: actualCalories,
        target_protein: targetProtein,
        actual_protein: actualProtein,
        score
      };
      
      const payload: any = {
        ...metricPayload,
        user_id: userId,
      };
      
      const { data, error } = await supabase
        .from('daily_metrics')
        .upsert(payload, { onConflict: 'user_id,date' })
        .select()
        .maybeSingle();
        
      if (error && error.code !== 'PGRST116') {
        console.error('Error updating daily metric:', error);
        return null;
      }
      
      try {
        const allMetrics = await reportService.getDailyMetrics();
        const { awardService } = await import('@/features/awards/services/awardService');
        await awardService.syncStreaksAndAwards(allMetrics);
      } catch (err) {
        console.error('Error syncing awards:', err);
      }
      
      return data || payload;
    } catch (e) {
      console.error('Compliance service error:', e);
      return null;
    }
  },
  
  async getScores(): Promise<{ todayScore: number, weeklyAverage: number, monthlyAverage: number }> {
    let metrics = queryClient.getQueryData<DbDailyMetric[]>(['dailyMetrics']);
    if (!metrics) {
      metrics = await queryClient.fetchQuery({
        queryKey: ['dailyMetrics'],
        queryFn: () => reportService.getDailyMetrics()
      });
    }
    
    if (!metrics || metrics.length === 0) {
      return { todayScore: 0, weeklyAverage: 0, monthlyAverage: 0 };
    }
    
    const todayStr = getLocalDateString();
    const todayMetric = metrics.find(m => m.date === todayStr);
    const todayScore = todayMetric ? todayMetric.score : 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // start of day for accurate comparison
    
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    
    const monthAgo = new Date(today);
    monthAgo.setDate(today.getDate() - 30);
    
    const weeklyMetrics = metrics.filter(m => new Date(m.date) >= weekAgo);
    const monthlyMetrics = metrics.filter(m => new Date(m.date) >= monthAgo);
    
    const weeklyAverage = weeklyMetrics.length > 0 
      ? Math.round(weeklyMetrics.reduce((acc, m) => acc + m.score, 0) / weeklyMetrics.length)
      : 0;
      
    const monthlyAverage = monthlyMetrics.length > 0
      ? Math.round(monthlyMetrics.reduce((acc, m) => acc + m.score, 0) / monthlyMetrics.length)
      : 0;
      
    return { todayScore, weeklyAverage, monthlyAverage };
  }
};
