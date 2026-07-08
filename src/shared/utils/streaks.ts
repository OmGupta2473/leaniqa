import { DbDailyMetric } from '@/shared/types/supabase';

export interface Award {
  id: string;
  category: string;
  name: string;
  description: string;
  requirement: string;
  streakRequired: number;
  tier: string;
  shape: string;
  primaryColor: string;
  accentColor: string;
  symbol: string;
  symbolText: string;
  earned?: boolean;
  earnedDate?: string | null;
  currentStreak?: number;
}

export const AWARDS_CATALOG: Award[] = [
  { id: 'streak_1', category: 'daily', name: 'First Spark', description: 'Hit both calorie and protein targets for your first successful day.', requirement: 'Maintain a 1-day streak', streakRequired: 1, tier: 'bronze', shape: 'hexagon', primaryColor: '#D4FF00', accentColor: '#A8CC00', symbol: '⚡', symbolText: '1' },
  { id: 'streak_3', category: 'daily', name: 'Streak Starter', description: 'Three consecutive days hitting all targets.', requirement: 'Maintain a 3-day streak', streakRequired: 3, tier: 'bronze', shape: 'hexagon', primaryColor: '#D4FF00', accentColor: '#8FAA00', symbol: '🔥', symbolText: '3' },
  { id: 'streak_7', category: 'daily', name: 'One Week Strong', description: 'Seven days straight. A full week of perfect discipline.', requirement: 'Maintain a 7-day streak', streakRequired: 7, tier: 'silver', shape: 'hexagon', primaryColor: '#FF4D1C', accentColor: '#C0C0C0', symbol: '📅', symbolText: '7' },
  { id: 'streak_14', category: 'daily', name: 'Consistency Builder', description: 'Fourteen consecutive days. You are building a real habit now.', requirement: 'Maintain a 14-day streak', streakRequired: 14, tier: 'silver', shape: 'hexagon', primaryColor: '#FF4D1C', accentColor: '#C0C0C0', symbol: '🏗️', symbolText: '14' },
  { id: 'streak_30', category: 'daily', name: 'Discipline Master', description: 'Thirty days. One entire month of consistency. Elite level achieved.', requirement: 'Maintain a 30-day streak', streakRequired: 30, tier: 'gold', shape: 'hexagon', primaryColor: '#FFD700', accentColor: '#FF8C00', symbol: '💎', symbolText: '30' },
  { id: 'streak_60', category: 'daily', name: 'Elite Performer', description: 'Sixty consecutive days. Unwavering focus and dedication.', requirement: 'Maintain a 60-day streak', streakRequired: 60, tier: 'gold', shape: 'hexagon', primaryColor: '#FFD700', accentColor: '#FF8C00', symbol: '🚀', symbolText: '60' },
  { id: 'streak_100', category: 'daily', name: 'Unbreakable', description: 'One hundred days of perfect discipline. You are unstoppable.', requirement: 'Maintain a 100-day streak', streakRequired: 100, tier: 'gold', shape: 'hexagon', primaryColor: '#00E5FF', accentColor: '#00B3CC', symbol: '🛡️', symbolText: '100' },
  { id: 'streak_180', category: 'daily', name: 'Legend', description: 'Half a year of unbroken consistency. A true legend.', requirement: 'Maintain a 180-day streak', streakRequired: 180, tier: 'gold', shape: 'hexagon', primaryColor: '#B100FF', accentColor: '#8B00CC', symbol: '👑', symbolText: '180' },
  { id: 'streak_365', category: 'daily', name: 'LeanIQA Champion', description: 'A full year of mastery. You have conquered the journey.', requirement: 'Maintain a 365-day streak', streakRequired: 365, tier: 'gold', shape: 'hexagon', primaryColor: '#FF0055', accentColor: '#CC0044', symbol: '🏆', symbolText: '365' }
];

export function toUtcDay(dateStr: string | Date): number {
  if (!dateStr) return 0;
  let iso = typeof dateStr === 'string' ? dateStr : dateStr.toISOString();
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return 0;
  const d = new Date(Date.UTC(+match[1], +match[2] - 1, +match[3]));
  return Math.floor(d.getTime() / 86400000);
}

export function calculateCurrentStreak(metrics: DbDailyMetric[], predicate: (m: DbDailyMetric) => boolean): number {
  if (!metrics || metrics.length === 0) return 0;
  
  const dayMap = new Map<number, DbDailyMetric>();
  for (const m of metrics) {
     dayMap.set(toUtcDay(m.date), m);
  }
  
  const todayDayNum = toUtcDay(new Date());
  
  let streak = 0;
  // Evaluate the streak only after the day is complete (start from yesterday)
  let currentDayNum = todayDayNum - 1;
  
  while (dayMap.has(currentDayNum)) {
      if (predicate(dayMap.get(currentDayNum)!)) {
          streak++;
          currentDayNum--;
      } else {
          break;
      }
  }
  
  return streak;
}

export function calculateBestStreak(metrics: DbDailyMetric[], predicate: (m: DbDailyMetric) => boolean): number {
  if (!metrics || metrics.length === 0) return 0;
  
  const sorted = [...metrics].sort((a, b) => toUtcDay(a.date) - toUtcDay(b.date));
  
  let best = 0;
  let current = 0;
  let prevDayNum: number | null = null;
  
  for (const m of sorted) {
    const dayNum = toUtcDay(m.date);
    if (predicate(m)) {
        if (prevDayNum !== null && dayNum === prevDayNum) {
            // duplicate day, ignore
        } else if (prevDayNum !== null && dayNum === prevDayNum + 1) {
            current++;
        } else {
            current = 1;
        }
        best = Math.max(best, current);
    } else {
        current = 0;
    }
    prevDayNum = dayNum;
  }
  
  return best;
}

export const isDailyGoalMet = (m: DbDailyMetric) => 
  m.actual_calories > 0 && 
  m.actual_calories <= m.target_calories && 
  m.actual_protein > 0 && 
  m.actual_protein >= m.target_protein;

export function calculateCurrentDailyStreak(metrics: DbDailyMetric[]): number {
  return calculateCurrentStreak(metrics, isDailyGoalMet);
}

export function calculateBestDailyStreak(metrics: DbDailyMetric[]): number {
  return calculateBestStreak(metrics, isDailyGoalMet);
}

export function calculateEarnedAwards(metrics: DbDailyMetric[]): Award[] {
  if (!metrics || metrics.length === 0) {
    return AWARDS_CATALOG.map(award => ({ ...award, earned: false, earnedDate: null, currentStreak: 0 }));
  }
  
  const currentDailyStreak = calculateCurrentDailyStreak(metrics);
  const bestDailyStreak = calculateBestDailyStreak(metrics);
  
  return AWARDS_CATALOG.map(award => {
    return {
      ...award,
      earned: bestDailyStreak >= award.streakRequired,
      earnedDate: null,
      currentStreak: currentDailyStreak
    };
  });
}
