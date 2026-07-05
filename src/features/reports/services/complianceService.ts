import { queryClient } from '@/app/query/queryClient';
import { supabase } from '@/shared/utils/supabase';
import { calculateDailyScore } from '@/shared/utils/complianceEngine';
import { mealService } from '@/features/nutrition';
import { weightService } from '@/features/progress';
import { profileService } from '@/features/profile';
import { reportService } from './reportService';
import { authService } from '@/features/auth';
import { DbDailyMetric } from '@/shared/types/supabase';

function getLocalDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const complianceService = {
  async updateTodayScore(): Promise<DbDailyMetric | null> {
    try {
      const userId = await authService.getUserId();
      
      let profile = queryClient.getQueryData<any>(['profile']);
      if (!profile) profile = await queryClient.fetchQuery({ queryKey: ['profile'], queryFn: () => profileService.getProfile() });
      
      let goal = queryClient.getQueryData<any>(['goal']);
      if (!goal) goal = await queryClient.fetchQuery({ queryKey: ['goal'], queryFn: () => profileService.getGoal() });
      
      if (!profile) return null;
      
      const today = getLocalDateString();
      
      // Fetch today's data
      let meals = queryClient.getQueryData<any[]>(['meals', 'today']);
      if (!meals) meals = await queryClient.fetchQuery({ queryKey: ['meals', 'today'], queryFn: () => mealService.getTodaysMeals() });
      
      let weightLogs = queryClient.getQueryData<any[]>(['weightLogs']);
      if (!weightLogs) weightLogs = await queryClient.fetchQuery({ queryKey: ['weightLogs'], queryFn: () => weightService.getWeightLogs() });
      
      const waterServiceRef = (await import('@/shared/services/waterService')).waterService;
      const waterTotalMl = await waterServiceRef.getTodaysWaterTotal();
      const waterLiters = waterTotalMl / 1000;
      
      const hasWeightLogged = weightLogs.some(w => w.date.startsWith(today));
      const actualCalories = meals.reduce((acc, m) => acc + m.calories, 0);
      const actualProtein = meals.reduce((acc, m) => acc + m.protein, 0);
      
      const targetCalories = (profile.maintenance_kcal || 2200) - (goal?.deficit_kcal ?? 400);
      const targetProtein = profile.protein_target || 150;
      
      const score = calculateDailyScore({
        targetCalories,
        actualCalories,
        targetProtein,
        actualProtein,
        hasWeightLogged,
        waterLiters
      });
      
      const metricPayload = {
        date: today,
        target_calories: targetCalories,
        actual_calories: actualCalories,
        target_protein: targetProtein,
        actual_protein: actualProtein,
        water: waterLiters,
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
