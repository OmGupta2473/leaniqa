import { supabase } from '../lib/supabase';
import { DbMealLog } from '../types/supabase';
import { authService } from './authService';

export const mealService = {
  async getMeals(): Promise<DbMealLog[]> {
    const userId = await authService.getUserId();
    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .order('meal_time', { ascending: true });
      
    if (error) {
      console.error('Error fetching meals:', error);
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
      .single();
      
    if (error) {
      console.error('Error adding meal:', error);
      throw error;
    }
    return data;
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
