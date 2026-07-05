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
  // ── CALORIE AWARDS ──────────────────────────────────────────
  { id: 'cal_spark', category: 'calories', name: 'First Spark', description: 'Stayed within your calorie target for the very first day.', requirement: 'Maintain a 1-day calorie streak', streakRequired: 1, tier: 'bronze', shape: 'hexagon', primaryColor: '#D4FF00', accentColor: '#A8CC00', symbol: '⚡', symbolText: '1' },
  { id: 'cal_starter', category: 'calories', name: 'Calorie Starter', description: 'Three consecutive days under your calorie target. The habit is forming.', requirement: 'Maintain a 3-day calorie streak', streakRequired: 3, tier: 'bronze', shape: 'hexagon', primaryColor: '#D4FF00', accentColor: '#8FAA00', symbol: '🔥', symbolText: '3' },
  { id: 'cal_builder', category: 'calories', name: 'Calorie Builder', description: 'Five days straight. You are building a real habit now.', requirement: 'Maintain a 5-day calorie streak', streakRequired: 5, tier: 'silver', shape: 'hexagon', primaryColor: '#D4FF00', accentColor: '#C0C0C0', symbol: '🏗️', symbolText: '5' },
  { id: 'cal_warrior', category: 'calories', name: 'Calorie Warrior', description: 'Ten consecutive days of discipline. A true warrior of the deficit.', requirement: 'Maintain a 10-day calorie streak', streakRequired: 10, tier: 'silver', shape: 'hexagon', primaryColor: '#FF4D1C', accentColor: '#C0C0C0', symbol: '⚔️', symbolText: '10' },
  { id: 'cal_legend', category: 'calories', name: 'Calorie Legend', description: 'Twenty-one days. You have built a permanent habit. This is identity.', requirement: 'Maintain a 21-day calorie streak', streakRequired: 21, tier: 'gold', shape: 'hexagon', primaryColor: '#FFD700', accentColor: '#FFA500', symbol: '👑', symbolText: '21' },
  { id: 'cal_elite', category: 'calories', name: 'Elite Cutter', description: 'Thirty days of perfect calorie discipline. Elite level achieved.', requirement: 'Maintain a 30-day calorie streak', streakRequired: 30, tier: 'gold', shape: 'hexagon', primaryColor: '#FFD700', accentColor: '#FF8C00', symbol: '💎', symbolText: '30' },
  // ── PROTEIN AWARDS ───────────────────────────────────────────
  { id: 'pro_ignite', category: 'protein', name: 'Protein Ignite', description: 'Hit your protein target on the very first day. Muscles are watching.', requirement: 'Hit protein target for 1 day', streakRequired: 1, tier: 'bronze', shape: 'shield', primaryColor: '#FF4D1C', accentColor: '#FF6B40', symbol: '💪', symbolText: '1' },
  { id: 'pro_builder', category: 'protein', name: 'Muscle Builder', description: 'Three days of hitting protein. Your muscle preservation protocol is active.', requirement: 'Hit protein target for 3 consecutive days', streakRequired: 3, tier: 'bronze', shape: 'shield', primaryColor: '#FF4D1C', accentColor: '#CC3300', symbol: '🏋️', symbolText: '3' },
  { id: 'pro_defender', category: 'protein', name: 'Muscle Defender', description: 'Five days straight. Your lean mass is being protected at every meal.', requirement: 'Hit protein target for 5 consecutive days', streakRequired: 5, tier: 'silver', shape: 'shield', primaryColor: '#FF4D1C', accentColor: '#C0C0C0', symbol: '🛡️', symbolText: '5' },
  { id: 'pro_titan', category: 'protein', name: 'Protein Titan', description: 'Ten days of hitting your protein target. Muscle loss is not happening to you.', requirement: 'Hit protein target for 10 consecutive days', streakRequired: 10, tier: 'silver', shape: 'shield', primaryColor: '#378ADD', accentColor: '#C0C0C0', symbol: '⚡', symbolText: '10' },
  { id: 'pro_immortal', category: 'protein', name: 'Protein Immortal', description: 'Twenty-one days. Your muscle is immortal. The lean body is inevitable.', requirement: 'Hit protein target for 21 consecutive days', streakRequired: 21, tier: 'gold', shape: 'shield', primaryColor: '#FFD700', accentColor: '#378ADD', symbol: '🦾', symbolText: '21' },
  { id: 'pro_god', category: 'protein', name: 'Protein God', description: 'Thirty days. Lean mass fully protected. Nothing will stop your transformation.', requirement: 'Hit protein target for 30 consecutive days', streakRequired: 30, tier: 'gold', shape: 'shield', primaryColor: '#FFD700', accentColor: '#FF4D1C', symbol: '🔱', symbolText: '30' }
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

export const isCalorieGoalMet = (m: DbDailyMetric) => m.actual_calories > 0 && m.actual_calories <= m.target_calories;
export const isProteinGoalMet = (m: DbDailyMetric) => m.actual_protein > 0 && m.actual_protein >= m.target_protein;

export function calculateCurrentCalorieStreak(metrics: DbDailyMetric[]): number {
  return calculateCurrentStreak(metrics, isCalorieGoalMet);
}

export function calculateCurrentProteinStreak(metrics: DbDailyMetric[]): number {
  return calculateCurrentStreak(metrics, isProteinGoalMet);
}

export function calculateBestCalorieStreak(metrics: DbDailyMetric[]): number {
  return calculateBestStreak(metrics, isCalorieGoalMet);
}

export function calculateBestProteinStreak(metrics: DbDailyMetric[]): number {
  return calculateBestStreak(metrics, isProteinGoalMet);
}

export function calculateEarnedAwards(metrics: DbDailyMetric[]): Award[] {
  if (!metrics || metrics.length === 0) {
    return AWARDS_CATALOG.map(award => ({ ...award, earned: false, earnedDate: null, currentStreak: 0 }));
  }
  
  const currentCalorieStreak = calculateCurrentCalorieStreak(metrics);
  const currentProteinStreak = calculateCurrentProteinStreak(metrics);

  return AWARDS_CATALOG.map(award => {
    const currentStreak = award.category === 'calories' ? currentCalorieStreak : currentProteinStreak;
    return {
      ...award,
      earned: currentStreak >= award.streakRequired,
      earnedDate: null,
      currentStreak
    };
  });
}
