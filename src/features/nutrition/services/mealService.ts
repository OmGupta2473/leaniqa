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

  async getMealsForDate(date: Date): Promise<DbMealLog[]> {
    const userId = await authService.getUserId();
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();
    
    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('meal_time', startOfDay)
      .lt('meal_time', endOfDay)
      .order('meal_time', { ascending: true });
      
    if (error) {
      console.error('Error fetching meals for date:', error);
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
    
    // Ensure all numeric fields are integers (Supabase expects integers based on schema)
    payload.calories = Math.round(payload.calories || 0);
    payload.protein = Math.round(payload.protein || 0);
    payload.fat = Math.round(payload.fat || 0);
    payload.carbs = Math.round(payload.carbs || 0);
    
    console.log('--- SUPABASE INSERT PAYLOAD ---', payload);
    
    let res = await supabase
      .from('meal_logs')
      .insert(payload)
      .select()
      .maybeSingle();
      
    // If the error indicates a missing column (PGRST204 or PGRST205 or message includes column), try without meal_slot
    if (res.error && (res.error.code?.startsWith('PGRST20') || res.error.message?.toLowerCase().includes('column'))) {
      console.warn('Column might be missing. Retrying without meal_slot.');
      const fallbackPayload = { ...payload };
      delete (fallbackPayload as any).meal_slot;
      res = await supabase
        .from('meal_logs')
        .insert(fallbackPayload)
        .select()
        .maybeSingle();
    }
      
    if (res.error && res.error.code !== 'PGRST116') {
      console.error('--- SUPABASE INSERT ERROR ---');
      console.error('Payload:', payload);
      console.error('Error Details:', JSON.stringify(res.error, null, 2));
      console.error('Raw Error:', res.error);
      throw res.error;
    }
    console.log('--- SUPABASE INSERT SUCCESS ---', res.data);
    return res.data || payload;
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
    // dateStr is 'YYYY-MM-DD'
    const [year, month, day] = dateStr.split('-').map(Number);
    const startOfDay = new Date(year, month - 1, day).toISOString();
    const endOfDay = new Date(year, month - 1, day + 1).toISOString();
    
    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('meal_time', startOfDay)
      .lt('meal_time', endOfDay)
      .order('meal_time', { ascending: true });
      
    if (error) {
      console.error('Error fetching meals by date:', error);
      return [];
    }
    return data || [];
  }
};
