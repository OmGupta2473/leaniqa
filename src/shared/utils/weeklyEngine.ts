import type { DbMealLog, DbWeightLog } from '@/shared/types/supabase';
import { getKolkataDateString, shiftKolkataDateString } from './timezone';
import { getWeekDays, computeWeekStatus } from './weekKey';
import { calculateDailyScore } from './complianceEngine';

export type DaySummaryStatus =
  | 'not_logged'
  | 'on_target'
  | 'under'
  | 'over'
  | 'protein_low'
  | 'in_progress';

export interface DaySummary {
  date: string;
  dayOfWeek: number;
  logged: boolean;
  isToday: boolean;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  status: DaySummaryStatus;
  score: number;
}

export interface WeeklyEngineInput {
  weekStart: string;
  weekEnd: string;
  nowIsoDate: string;
  meals: DbMealLog[];
  weightLogs: DbWeightLog[];
  targets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface WeeklyEngineResult {
  weekStartDate: string;
  weekEndDate: string;
  status: 'live' | 'final';
  daysWithMeals: number;
  daysCompleted: number;
  daysWithWeight: number;
  totalCalories: number;
  avgCalories: number;
  targetCalories: number;
  totalProteinG: number;
  avgProteinG: number;
  targetProteinG: number;
  totalCarbsG: number;
  avgCarbsG: number;
  targetCarbsG: number;
  totalFatG: number;
  avgFatG: number;
  targetFatG: number;
  weeklyScore: number;
  confidence: 'empty' | 'insufficient' | 'low' | 'medium' | 'high';
  daySummaries: DaySummary[];
}

export interface TrendDataPoint {
  date: string;
  calories: number;
  proteinG: number;
}

export interface TrendDataResult {
  points: TrendDataPoint[];
  targetCalories: number;
  targetProteinG: number;
}

/**
 * Returns trend data for the last `days` (7 or 30) ending on `endDate` (inclusive).
 * Each point has calories (rounded to 1 decimal) and proteinG (rounded to 1 decimal).
 * Missing days return 0 for both macros.
 */
export function getTrendData(
  meals: import('@/shared/types/supabase').DbMealLog[],
  endDate: string,
  days: 7 | 30,
  targets: { calories: number; protein: number },
): TrendDataResult {
  const points: TrendDataPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = shiftKolkataDateString(endDate, -i);
    const dayMeals = meals.filter((m) => {
      const mealDate = getKolkataDateString(new Date(m.meal_time));
      return mealDate === date;
    });
    let calories = 0;
    let proteinG = 0;
    for (const meal of dayMeals) {
      calories += meal.calories;
      proteinG += meal.protein;
    }
    points.push({
      date,
      calories: Math.round(calories * 10) / 10,
      proteinG: Math.round(proteinG * 10) / 10,
    });
  }
  return {
    points,
    targetCalories: targets.calories,
    targetProteinG: targets.protein,
  };
}

export interface StreakResult {
  calorie: { current: number; longest: number; inProgress: boolean };
  protein: { current: number; longest: number; inProgress: boolean };
}

/**
 * Computes calorie and protein streaks from daily_metrics.
 * - Calorie hit: within ±10% of target
 * - Protein hit: >= 90% of target
 * - Missing daily_metrics row = streak break
 * - Evaluation capped at last 90 days
 * - Today excluded (partial day = inProgress)
 */
export function getStreaks(
  dailyMetrics: Array<{
    date: string;
    target_calories: number;
    actual_calories: number;
    target_protein: number;
    actual_protein: number;
  }>,
  today: string,
  targets: { calories: number; protein: number },
): StreakResult {
  // Filter to last 90 days ending yesterday (exclude today)
  const relevantDays = dailyMetrics
    .filter((d) => d.date < today)
    .slice(-90);

  let calCurrent = 0;
  let calLongest = 0;
  let proCurrent = 0;
  let proLongest = 0;

  for (const day of relevantDays) {
    const calHit =
      day.actual_calories >= 0.9 * day.target_calories &&
      day.actual_calories <= 1.1 * day.target_calories;
    const proHit = day.actual_protein >= 0.9 * day.target_protein;

    // Calorie streak
    if (calHit) {
      calCurrent++;
      calLongest = Math.max(calLongest, calCurrent);
    } else {
      calCurrent = 0;
    }

    // Protein streak
    if (proHit) {
      proCurrent++;
      proLongest = Math.max(proLongest, proCurrent);
    } else {
      proCurrent = 0;
    }
  }

  // Check if today is "in progress" (has metrics but not a full day yet)
  const todayMetrics = dailyMetrics.find((d) => d.date === today);
  const calInProgress = todayMetrics
    ? todayMetrics.actual_calories > 0 || todayMetrics.actual_protein > 0
    : false;
  const proInProgress = calInProgress;

  return {
    calorie: { current: calCurrent, longest: calLongest, inProgress: calInProgress },
    protein: { current: proCurrent, longest: proLongest, inProgress: proInProgress },
  };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function getDayOfWeekFor(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function istDateFromMealTime(mealTime: string): string {
  return getKolkataDateString(new Date(mealTime));
}

function hasWeightLogOn(weightLogs: DbWeightLog[], dateStr: string): boolean {
  return weightLogs.some((w) => w.date === dateStr);
}

function statusFor(
  calories: number,
  proteinG: number,
  targetCalories: number,
  targetProtein: number,
  logged: boolean,
): DaySummaryStatus {
  if (!logged) return 'not_logged';
  if (
    calories >= 0.9 * targetCalories &&
    calories <= 1.1 * targetCalories &&
    proteinG >= 0.9 * targetProtein
  ) {
    return 'on_target';
  }
  if (calories > 1.1 * targetCalories) return 'over';
  if (calories < 0.9 * targetCalories) return 'under';
  return 'protein_low';
}

function confidenceFor(daysWithMeals: number): WeeklyEngineResult['confidence'] {
  if (daysWithMeals === 0) return 'empty';
  if (daysWithMeals <= 2) return 'insufficient';
  if (daysWithMeals <= 4) return 'low';
  if (daysWithMeals <= 6) return 'medium';
  return 'high';
}

export function computeWeeklyReport(input: WeeklyEngineInput): WeeklyEngineResult {
  const weekDays = getWeekDays(input.weekStart);
  const targetCalories = input.targets.calories;
  const targetProtein = input.targets.protein;
  const targetCarbs = input.targets.carbs;
  const targetFat = input.targets.fat;

  const mealsByDay = new Map<string, DbMealLog[]>();
  for (const meal of input.meals) {
    const day = istDateFromMealTime(meal.meal_time);
    const bucket = mealsByDay.get(day) ?? [];
    bucket.push(meal);
    mealsByDay.set(day, bucket);
  }

  const daySummaries: DaySummary[] = [];
  for (const day of weekDays) {
    const meals = mealsByDay.get(day) ?? [];
    const logged = meals.length > 0;

    let cal = 0;
    let pro = 0;
    let carb = 0;
    let fat = 0;
    for (const meal of meals) {
      cal += meal.calories;
      pro += meal.protein;
      carb += meal.carbs;
      fat += meal.fat;
    }

    const calories = Math.round(cal);
    const proteinG = round1(pro);
    const carbsG = round1(carb);
    const fatG = round1(fat);

    const hasWeightLogged = hasWeightLogOn(input.weightLogs, day);
    const score = logged
      ? calculateDailyScore({
          targetCalories,
          actualCalories: calories,
          targetProtein,
          actualProtein: proteinG,
          hasWeightLogged,
        })
      : 0;

    const isToday = day === input.nowIsoDate;
    const computedStatus = statusFor(calories, proteinG, targetCalories, targetProtein, logged);
    const status = isToday && logged ? 'in_progress' : computedStatus;

    daySummaries.push({
      date: day,
      dayOfWeek: getDayOfWeekFor(day),
      logged,
      isToday,
      calories,
      proteinG,
      carbsG,
      fatG,
      status,
      score,
    });
  }

  const loggedDays = daySummaries.filter((s) => s.logged);
  const completedDays = daySummaries.filter((s) => s.logged && !s.isToday);
  const daysWithMeals = loggedDays.length;
  const daysCompleted = completedDays.length;
  const daysWithWeight = weekDays.filter((d) => hasWeightLogOn(input.weightLogs, d)).length;

  let totalCalories = 0;
  let totalProteinG = 0;
  let totalCarbsG = 0;
  let totalFatG = 0;
  for (const s of completedDays) {
    totalCalories += s.calories;
    totalProteinG += s.proteinG;
    totalCarbsG += s.carbsG;
    totalFatG += s.fatG;
  }
  totalCalories = Math.round(totalCalories);
  totalProteinG = round1(totalProteinG);
  totalCarbsG = round1(totalCarbsG);
  totalFatG = round1(totalFatG);

  const avgCalories = daysCompleted > 0 ? Math.round(totalCalories / daysCompleted) : 0;
  const avgProteinG = daysCompleted > 0 ? round1(totalProteinG / daysCompleted) : 0;
  const avgCarbsG = daysCompleted > 0 ? round1(totalCarbsG / daysCompleted) : 0;
  const avgFatG = daysCompleted > 0 ? round1(totalFatG / daysCompleted) : 0;

  let weeklyScore = 0;
  if (daysCompleted > 0) {
    let calHit = 0;
    let proHit = 0;
    for (const s of completedDays) {
      if (s.calories >= 0.9 * targetCalories && s.calories <= 1.1 * targetCalories) calHit++;
      if (s.proteinG >= 0.9 * targetProtein) proHit++;
    }
    const calorieScore = (calHit / daysCompleted) * 40;
    const proteinScore = (proHit / daysCompleted) * 30;
    const loggingScore = (daysCompleted / 7) * 20;

    let macroScore = 0;
    if (targetCalories > 0) {
      const pTargetShare = (targetProtein * 4) / targetCalories;
      const cTargetShare = (targetCarbs * 4) / targetCalories;
      const fTargetShare = (targetFat * 9) / targetCalories;
      let devSum = 0;
      let devCount = 0;
      for (const s of completedDays) {
        if (s.calories <= 0) continue;
        const pShare = (s.proteinG * 4) / s.calories;
        const cShare = (s.carbsG * 4) / s.calories;
        const fShare = (s.fatG * 9) / s.calories;
        const dev =
          (Math.abs(pShare - pTargetShare) +
            Math.abs(cShare - cTargetShare) +
            Math.abs(fShare - fTargetShare)) /
          2;
        devSum += dev;
        devCount++;
      }
      macroScore = devCount > 0 ? Math.max(0, (1 - devSum / devCount) * 10) : 10;
    }
    weeklyScore = Math.max(
      0,
      Math.min(100, Math.round(calorieScore + proteinScore + loggingScore + macroScore)),
    );
  }

  const confidence = confidenceFor(daysCompleted);

  return {
    weekStartDate: input.weekStart,
    weekEndDate: input.weekEnd,
    status: computeWeekStatus(input.weekEnd, input.nowIsoDate),
    daysWithMeals,
    daysCompleted,
    daysWithWeight,
    totalCalories,
    avgCalories,
    targetCalories,
    totalProteinG,
    avgProteinG,
    targetProteinG: targetProtein,
    totalCarbsG,
    avgCarbsG,
    targetCarbsG: targetCarbs,
    totalFatG,
    avgFatG,
    targetFatG: targetFat,
    weeklyScore,
    confidence: confidenceFor(daysWithMeals),
    daySummaries,
  };
}