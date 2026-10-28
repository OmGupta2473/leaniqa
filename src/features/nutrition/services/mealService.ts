import { supabase } from '@/shared/utils/supabase';
import { DbMealLog } from '@/shared/types/supabase';
import { authService } from '@/features/auth/services/authService';
import { logError } from '@/shared/utils/logger';
import { devLog, devWarn } from '@/shared/utils/logger';
import { getKolkataStartOfDay, kolkataDateStringToUtcMidnight } from '@/shared/utils/timezone';

export const mealService = {
    async getMealsInRange(fromIso: string, toIsoExclusive: string): Promise<DbMealLog[]> {
    const userId = await authService.getUserId();
    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('meal_time', fromIso)
      .lt('meal_time', toIsoExclusive)
      .order('meal_time', { ascending: true });
    if (error) {
      logError(new Error('Error fetching meals in range'), { error, userId, fromIso, toIsoExclusive });
      throw error;
    }
    return data || [];
  },
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
    // Persisted source: how was this meal logged?
    // 'legacy' is the safe fallback for old offline queue items and any
    // caller that hasn't been updated. All real write paths pass one of the
    // whitelisted values explicitly.
    const ALLOWED_MEAL_SOURCES = new Set([
      'manual', 'kb', 'memory_cache', 'db_cache', 'ai', 'legacy',
    ]);
    const rawSource = (mealData as { meal_source?: unknown }).meal_source;
    const meal_source =
      typeof rawSource === 'string' && ALLOWED_MEAL_SOURCES.has(rawSource)
        ? rawSource
        : 'legacy';

    const payload = {
      ...restMealData,
      user_id: userId,
      meal_source,
    };
    
      // Ensure numeric fields are finite, non-negative, and rounded to 1
      // decimal place. Rounding here prevents floating-point artefacts
      // (e.g. 49.50000000000001) from being stored and later surfaced in
      // the UI when per-item rows are displayed.
      const round1 = (v: unknown) => {
        const n = Number(v);
        return Number.isFinite(n) && n > 0 ? Math.round(n * 10) / 10 : 0;
      };
      payload.calories = round1(payload.calories);
      payload.protein = round1(payload.protein);
      payload.fat = round1(payload.fat);
      payload.carbs = round1(payload.carbs);
      payload.fiber = round1(fiber);
    
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
    const round1 = (v: unknown) => {
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? Math.round(n * 10) / 10 : 0;
    };
    if (typeof payload.calories === 'number') payload.calories = round1(payload.calories);
    if (typeof payload.protein === 'number') payload.protein = round1(payload.protein);
    if (typeof payload.fat === 'number') payload.fat = round1(payload.fat);
    if (typeof payload.carbs === 'number') payload.carbs = round1(payload.carbs);
    if (typeof payload.fiber === 'number') payload.fiber = round1(payload.fiber);
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
  },

  async getFirstMealDate(): Promise<string | null> {
    const userId = await authService.getUserId();
    const { data, error } = await supabase
      .from('meal_logs')
      .select('meal_time')
      .eq('user_id', userId)
      .order('meal_time', { ascending: true })
      .limit(1);
      
    if (error) {
      logError(new Error('Error fetching first meal date'), { error, userId });
      throw error;
    }
    
    if (!data || data.length === 0) {
      return null;
    }
    
    const { getKolkataDateString } = await import('@/shared/utils/timezone');
    return getKolkataDateString(new Date(data[0].meal_time));
  }
};
