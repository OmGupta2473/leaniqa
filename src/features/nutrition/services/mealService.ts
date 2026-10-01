import { supabase } from '@/shared/utils/supabase';
import { DbMealLog } from '@/shared/types/supabase';
import { authService } from '@/features/auth/services/authService';
import { logError } from '@/shared/utils/logger';
import { devLog, devWarn } from '@/shared/utils/logger';
import { getKolkataStartOfDay, kolkataDateStringToUtcMidnight } from '@/shared/utils/timezone';

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
      logError(new Error('Error fetching meals'), { error, userId, options });
      throw error;
    }
    return data || [];
  },

  async getMealsForWeeklyReport(): Promise<DbMealLog[]> {
    return this.getMeals({ days: 7, limit: 500 });
  },

  async getTodaysMeals(): Promise<DbMealLog[]> {
    const userId = await authService.getUserId();
    const startOfToday = getKolkataStartOfDay();
    const tomorrowInstant = new Date(new Date(startOfToday).getTime() + 24 * 60 * 60 * 1000);
    const startOfTomorrow = getKolkataStartOfDay(tomorrowInstant);
    
    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('meal_time', startOfToday)
      .lt('meal_time', startOfTomorrow)
      .order('meal_time', { ascending: true });
      
    if (error) {
      logError(new Error('Error fetching todays meals'), { error, userId });
      throw error;
    }
    return data || [];
  },

  async getMealsForDate(date: Date): Promise<DbMealLog[]> {
    const userId = await authService.getUserId();
    const startOfDay = getKolkataStartOfDay(date);
    const nextDayInstant = new Date(new Date(startOfDay).getTime() + 24 * 60 * 60 * 1000);
    const endOfDay = getKolkataStartOfDay(nextDayInstant);
    
    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('meal_time', startOfDay)
      .lt('meal_time', endOfDay)
      .order('meal_time', { ascending: true });
      
    if (error) {
      logError(new Error('Error fetching meals for date'), { error, userId, date: date.toISOString() });
      throw error;
    }
    return data || [];
  },

  async addMeal(mealData: Omit<DbMealLog, 'id' | 'user_id' | 'client_token'> & { client_token: string }): Promise<DbMealLog | null> {
    const userId = await authService.getUserId();
    const { fiber, ...restMealData } = mealData as any;
    if (restMealData.meal_slot === 'snack') {
      delete restMealData.meal_slot; // snack is not in DB ENUM yet
    }
    const payload = {
      ...restMealData,
      user_id: userId,
    };
    
    // Ensure all numeric fields are integers (Supabase expects integers based on schema)
    payload.calories = Math.round(payload.calories || 0);
    payload.protein = Math.round(payload.protein || 0);
    payload.fat = Math.round(payload.fat || 0);
    payload.carbs = Math.round(payload.carbs || 0);
    payload.fiber = Math.round(fiber || 0);
    
    devLog('--- SUPABASE INSERT PAYLOAD ---', payload);
    
    const res = await supabase
      .from('meal_logs')
      .upsert(payload, { onConflict: 'user_id,client_token' })
      .select()
      .maybeSingle();
      
    if (res.error && res.error.code !== 'PGRST116') {
      logError(new Error('Supabase insert error'), { error: res.error, payload });
      throw res.error;
    }
    devLog('--- SUPABASE INSERT SUCCESS ---', res.data);
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
      logError(new Error('Error deleting meal'), { error, id, userId });
      throw error;
    }
    return true;
  },

  async updateMeal(
    id: string,
    updates: Partial<Pick<DbMealLog, 'meal_text' | 'calories' | 'protein' | 'fat' | 'carbs' | 'fiber' | 'meal_slot' | 'tip'>>,
  ): Promise<DbMealLog | null> {
    const userId = await authService.getUserId();
    const payload: Record<string, unknown> = { ...updates };
    if (typeof payload.calories === 'number') payload.calories = Math.round(payload.calories);
    if (typeof payload.protein === 'number') payload.protein = Math.round(payload.protein);
    if (typeof payload.fat === 'number') payload.fat = Math.round(payload.fat);
    if (typeof payload.carbs === 'number') payload.carbs = Math.round(payload.carbs);
    if (typeof payload.fiber === 'number') payload.fiber = Math.round(payload.fiber);
    if (payload.meal_slot === 'snack') delete payload.meal_slot;  // matches addMeal behaviour
    const { data, error } = await supabase
      .from('meal_logs')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .maybeSingle();
    if (error) {
      logError(new Error('Error updating meal'), { error, id, userId });
      throw error;
    }
    return data;
  },
  async getMealsByDate(dateStr: string): Promise<DbMealLog[]> {
    const userId = await authService.getUserId();
    // dateStr is 'YYYY-MM-DD'
    const startOfDay = kolkataDateStringToUtcMidnight(dateStr).toISOString();
    const endInstant = new Date(new Date(startOfDay).getTime() + 24 * 60 * 60 * 1000);
    const endOfDay = endInstant.toISOString();
    
    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('meal_time', startOfDay)
      .lt('meal_time', endOfDay)
      .order('meal_time', { ascending: true });
      
    if (error) {
      logError(new Error('Error fetching meals by date'), { error, userId, dateStr });
      throw error;
    }
    return data || [];
  }
};
