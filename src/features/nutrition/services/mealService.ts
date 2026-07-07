import { supabase } from '@/shared/utils/supabase';
import { DbMealLog } from '@/shared/types/supabase';
import { authService } from '@/features/auth/services/authService';

export const mealService = {
  async getMeals(options?: { days?: number, limit?: number }): Promise<DbMealLog[]> {
    const userId = await authService.getUserId();
    const days = options?.days ?? 30;
    const limit = options?.limit ?? 200;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('meal_time', cutoffDate.toISOString())
      .order('meal_time', { ascending: true })
      .limit(limit);
      
    if (error) {
      console.error('Error fetching meals:', error);
      return [];
    }
    return data || [];
  },

  async getMealsForWeeklyReport(): Promise<DbMealLog[]> {
    return this.getMeals({ days: 7, limit: 500 });
  },

  async getTodaysMeals(): Promise<DbMealLog[]> {
    const userId = await authService.getUserId();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
    
    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('meal_time', startOfToday)
      .lt('meal_time', startOfTomorrow)
      .order('meal_time', { ascending: true });
      
    if (error) {
      console.error('Error fetching todays meals:', error);
      return [];
    }
    return data || [];
  },

  async addMeal(mealData: Omit<DbMealLog, 'id' | 'user_id'>): Promise<DbMealLog | null> {
    const userId = await authService.getUserId();
    const payload = {
      ...mealData,
      user_id: userId,
    };

    const { data, error } = await supabase
      .from('meal_logs')
      .insert(payload)
      .select()
      .maybeSingle();
      
    if (error && error.code !== 'PGRST116') {
      console.error('Error adding meal:', error);
      throw error;
    }
    return data || payload;
  },
  
  
  async deleteMeal(id: string): Promise<boolean> {
    const userId = await authService.getUserId();
    const { error } = await supabase
      .from('meal_logs')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error deleting meal:', error);
      throw error;
    }
    return true;
  },
  async getMealsByDate(dateStr: string): Promise<DbMealLog[]> {
    const userId = await authService.getUserId();
    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .like('meal_time', `${dateStr}%`)
      .order('meal_time', { ascending: true });
      
    if (error) {
      console.error('Error fetching meals by date:', error);
      return [];
    }
    return data || [];
  }
};
