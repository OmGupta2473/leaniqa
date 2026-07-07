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
  { id: 'streak_spark', category: 'daily', name: 'First Spark', description: 'Hit both calorie and protein targets for the first day.', requirement: 'Maintain a 1-day streak', streakRequired: 1, tier: 'bronze', shape: 'hexagon', primaryColor: '#D4FF00', accentColor: '#A8CC00', symbol: '⚡', symbolText: '1' },
  { id: 'streak_starter', category: 'daily', name: 'Streak Starter', description: 'Three consecutive days hitting all targets.', requirement: 'Maintain a 3-day streak', streakRequired: 3, tier: 'bronze', shape: 'hexagon', primaryColor: '#D4FF00', accentColor: '#8FAA00', symbol: '🔥', symbolText: '3' },
  { id: 'streak_builder', category: 'daily', name: 'Habit Builder', description: 'Five days straight. You are building a real habit now.', requirement: 'Maintain a 5-day streak', streakRequired: 5, tier: 'silver', shape: 'hexagon', primaryColor: '#D4FF00', accentColor: '#C0C0C0', symbol: '🏗️', symbolText: '5' },
  { id: 'streak_warrior', category: 'daily', name: 'Discipline Warrior', description: 'Ten consecutive days of discipline. A true warrior.', requirement: 'Maintain a 10-day streak', streakRequired: 10, tier: 'silver', shape: 'hexagon', primaryColor: '#FF4D1C', accentColor: '#C0C0C0', symbol: '⚔️', symbolText: '10' },
  { id: 'streak_legend', category: 'daily', name: 'Streak Legend', description: 'Twenty-one days. You have built a permanent habit. This is identity.', requirement: 'Maintain a 21-day streak', streakRequired: 21, tier: 'gold', shape: 'hexagon', primaryColor: '#FFD700', accentColor: '#FFA500', symbol: '👑', symbolText: '21' },
  { id: 'streak_elite', category: 'daily', name: 'Elite Transformer', description: 'Thirty days of perfect discipline. Elite level achieved.', requirement: 'Maintain a 30-day streak', streakRequired: 30, tier: 'gold', shape: 'hexagon', primaryColor: '#FFD700', accentColor: '#FF8C00', symbol: '💎', symbolText: '30' }
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
  let currentDayNum = todayDayNum;
  
  if (dayMap.has(todayDayNum) && !predicate(dayMap.get(todayDayNum)!)) {
      return 0;
  }
  
  if (dayMap.has(todayDayNum) && predicate(dayMap.get(todayDayNum)!)) {
      streak++;
  }
  
  currentDayNum--;
  
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
  return AWARDS_CATALOG.map(award => {
    return {
      ...award,
      earned: currentDailyStreak >= award.streakRequired,
      earnedDate: null,
      currentStreak: currentDailyStreak
    };
  });
}
