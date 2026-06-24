import { supabase } from '../lib/supabase';
import { calculateDailyScore } from '../lib/complianceEngine';
import { mealService } from './mealService';
import { weightService } from './weightService';
import { profileService } from './profileService';
import { reportService } from './reportService';
import { authService } from './authService';
import { DbDailyMetric } from '../types/supabase';

export const complianceService = {
  async updateTodayScore(waterLiters: number = 0): Promise<DbDailyMetric | null> {
    try {
      const userId = await authService.getUserId();
      const profile = await profileService.getProfile();
      
      if (!profile) return null;
      
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch today's data
      const meals = await mealService.getMealsByDate(today);
      const weightLogs = await weightService.getWeightLogs();
      
      const hasWeightLogged = weightLogs.some(w => w.date.startsWith(today));
      const actualCalories = meals.reduce((acc, m) => acc + m.calories, 0);
      const actualProtein = meals.reduce((acc, m) => acc + m.protein, 0);
      
      const targetCalories = (profile.maintenance_kcal || 2200) - 400; // Simplified deficit
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
      
      // Check existing
      const { data: existing } = await supabase
        .from('daily_metrics')
        .select('id')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();
        
      const payload = {
        ...metricPayload,
        user_id: userId,
        id: existing?.id || crypto.randomUUID()
      };
      
      const { data, error } = await supabase
        .from('daily_metrics')
        .upsert(payload)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating daily metric:', error);
        return null;
      }
      
      return data;
    } catch (e) {
      console.error('Compliance service error:', e);
      return null;
    }
  },
  
  async getScores(): Promise<{ todayScore: number, weeklyAverage: number, monthlyAverage: number }> {
    const metrics = await reportService.getDailyMetrics();
    
    if (!metrics || metrics.length === 0) {
      return { todayScore: 0, weeklyAverage: 0, monthlyAverage: 0 };
    }
    
    const todayStr = new Date().toISOString().split('T')[0];
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
