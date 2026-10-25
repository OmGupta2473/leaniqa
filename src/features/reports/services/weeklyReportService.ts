import { supabase } from '@/shared/utils/supabase';
import { authService } from '@/features/auth/services/authService';
import { shiftWeek, getWeekEnd } from '@/shared/utils/weekKey';
import { getKolkataDateString, kolkataDateStringToUtcMidnight, shiftKolkataDateString } from '@/shared/utils/timezone';
import { computeWeeklyReport } from '@/shared/utils/weeklyEngine';
import type { DbWeeklyReport } from '@/shared/types/supabase';

const PREVIOUS_WEEK_LOOKBACK = 12;


export type UpsertWeekResult =
  | { status: 'upserted'; weekStart: string; weeklyScore: number; confidence: string }
  | { status: 'skipped_missing_targets'; missing: string[] }
  | { status: 'skipped_no_session' };

export const weeklyReportService = {
  async getWeek(weekStart: string): Promise<DbWeeklyReport | null> {
    const userId = await authService.getUserId();
    const { data, error } = await supabase
      .from('weekly_reports')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start', weekStart)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching weekly report', error);
      throw error;
    }
    return data ?? null;
  },

  async getPreviousWeekWithMeals(weekStart: string): Promise<DbWeeklyReport | null> {
    const userId = await authService.getUserId();
    const earliestAllowed = shiftWeek(weekStart, -12);
    const { data, error } = await supabase
      .from('weekly_reports')
      .select('*')
      .eq('user_id', userId)
      .lt('week_start', weekStart)
      .gte('week_start', shiftWeek(weekStart, -12))
      .gt('days_with_meals', 0)
      .order('week_start', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching previous weekly report', error);
      throw error;
    }
    return data ?? null;
  },

  async listWeeksWithReports(): Promise<DbWeeklyReport[]> {
  const userId = await authService.getUserId();
  const { data, error } = await supabase
    .from('weekly_reports')
    .select('*')
    .eq('user_id', userId)
    .order('week_start', { ascending: false });
    if (error) {
      console.error('Error listing weekly reports', error);
      throw error;
    }
    return data ?? [];
  },

  async upsertWeek(weekStart: string): Promise<UpsertWeekResult> {
    let userId: string;
    try {
      userId = await authService.getUserId();
    } catch {
      return { status: 'skipped_no_session' };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('target_kcal, protein_target, carbs_target, fat_target')
      .eq('id', userId)
      .maybeSingle();
    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    const missing: string[] = [];
    if (profile?.target_kcal == null) missing.push('target_kcal');
    if (profile?.protein_target == null) missing.push('protein_target');
    if (profile?.carbs_target == null) missing.push('carbs_target');
    if (profile?.fat_target == null) missing.push('fat_target');
    if (missing.length > 0) {
      return { status: 'skipped_missing_targets', missing };
    }

    const weekEnd = getWeekEnd(weekStart);
    const startInstant = kolkataDateStringToUtcMidnight(weekStart).toISOString();
    const dayAfterWeekEnd = shiftKolkataDateString(weekEnd, 1);
    const endExclusive = kolkataDateStringToUtcMidnight(shiftKolkataDateString(weekEnd, 1)).toISOString();

    const { data: meals, error: mealsError } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('meal_time', kolkataDateStringToUtcMidnight(weekStart).toISOString())
      .lt('meal_time', kolkataDateStringToUtcMidnight(shiftKolkataDateString(weekEnd, 1)).toISOString());
    if (mealsError) throw mealsError;

    const { data: weightLogs, error: weightError } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', weekStart)
      .lte('date', weekEnd);
    if (weightError) throw weightError;

    const result = computeWeeklyReport({
      weekStart,
      weekEnd,
      nowIsoDate: getKolkataDateString(),
      meals: meals ?? [],
      weightLogs: weightLogs ?? [],
      targets: {
        calories: profile.target_kcal!,
        protein: profile.protein_target!,
        carbs: profile.carbs_target!,
        fat: profile.fat_target!,
      },
    });

    const now = new Date().toISOString();
    const payload = {
      user_id: userId,
      week_start: result.weekStartDate,
      week_end: result.weekEndDate,
      status: result.status,
      days_with_meals: result.daysWithMeals,
      days_with_weight: result.daysWithWeight,
      total_calories: result.totalCalories,
      avg_calories: result.avgCalories,
      target_calories: result.targetCalories,
      total_protein_g: result.totalProteinG,
      avg_protein_g: result.avgProteinG,
      target_protein_g: result.targetProteinG,
      total_carbs_g: result.totalCarbsG,
      avg_carbs_g: result.avgCarbsG,
      target_carbs_g: result.targetCarbsG,
      total_fat_g: result.totalFatG,
      avg_fat_g: result.avgFatG,
      target_fat_g: result.targetFatG,
      weekly_score: result.weeklyScore,
      confidence: result.confidence,
      day_summaries: result.daySummaries,
      computed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from('weekly_reports')
      .upsert(payload, { onConflict: 'user_id,week_start' })
      .select()
      .maybeSingle();
    if (upsertError && upsertError.code !== 'PGRST116') {
      throw upsertError;
    }

    return {
      status: 'upserted',
      weekStart: result.weekStartDate,
      weeklyScore: result.weeklyScore,
      confidence: result.confidence,
    };
  },

  /**
   * Generates 2-3 rule-based action items for the weekly report.
   * Tone: suggestions/options, never commands.
   * Max 3 items, deduplicated by category.
   */
  generateActionItems: (weekData: {
    daySummaries: Array<{
      date: string;
      calories: number;
      proteinG: number;
      logged: boolean;
      isToday: boolean;
    }>;
    targets: { calories: number; protein: number };
    streaks: { calorie: { current: number; longest: number }; protein: { current: number; longest: number } };
  }): string[] => {
    const { daySummaries, targets, streaks } = weekData;
    const completedDays = daySummaries.filter((d) => d.logged && !d.isToday);
    if (completedDays.length === 0) return [];

    const items: Array<{ category: string; text: string; priority: number }> = [];

    // Rule 1: Protein avg < 80% target on >= 4 days
    const proteinLowDays = completedDays.filter(
      (d) => d.proteinG < 0.8 * targets.protein
    ).length;
    if (proteinLowDays >= 4) {
      items.push({
        category: 'protein',
        text: 'If breakfast tends to be low in protein, adding eggs or Greek yogurt could help you reach your target.',
        priority: 1,
      });
    }

    // Rule 2: Calorie avg > 110% target on >= 4 days
    const calorieHighDays = completedDays.filter(
      (d) => d.calories > 1.1 * targets.calories
    ).length;
    if (calorieHighDays >= 4) {
      items.push({
        category: 'calories',
        text: 'If dinner tends to run high, swapping rice for vegetables could save around 100 kcal.',
        priority: 2,
      });
    }

    // Rule 3: Protein streak = 0
    if (streaks.protein.current === 0) {
      items.push({
        category: 'protein_streak',
        text: 'Aiming for roughly 25g of protein per meal could make the daily target easier to reach.',
        priority: 3,
      });
    }

    // Rule 4: Calorie streak >= 5
    if (streaks.calorie.current >= 5) {
      items.push({
        category: 'calorie_streak',
        text: 'Great consistency this week — your current portions are working well.',
        priority: 4,
      });
    }

    // Rule 5: Weekend calories > weekday average + 300
    const weekdayDays = completedDays.filter((d) => {
      const dayOfWeek = new Date(d.date).getUTCDay();
      return dayOfWeek >= 1 && dayOfWeek <= 5; // Mon-Fri
    });
    const weekendDays = completedDays.filter((d) => {
      const dayOfWeek = new Date(d.date).getUTCDay();
      return dayOfWeek === 0 || dayOfWeek === 6; // Sat-Sun
    });
    if (weekdayDays.length > 0 && weekendDays.length > 0) {
      const weekdayAvg = weekdayDays.reduce((sum, d) => sum + d.calories, 0) / weekdayDays.length;
      const weekendAvg = weekendDays.reduce((sum, d) => sum + d.calories, 0) / weekendDays.length;
      if (weekendAvg > weekdayAvg + 300) {
        items.push({
          category: 'weekend',
          text: 'Weekend intake ran higher than weekdays — planning meals ahead could help.',
          priority: 5,
        });
      }
    }

    // Deduplicate by category (keep highest priority = lowest number)
    const byCategory = new Map<string, typeof items[0]>();
    for (const item of items) {
      const existing = byCategory.get(item.category);
      if (!existing || item.priority < existing.priority) {
        byCategory.set(item.category, item);
      }
    }

    // Sort by priority and take top 3
    const deduped = Array.from(byCategory.values())
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 3)
      .map((i) => i.text);

    return deduped;
  },
};