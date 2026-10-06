import type { DbDailyMetric, DbMealLog, DbWeightLog, DbUserAward } from '@/shared/types/supabase';
import { calculateBestStreak, isDailyGoalMet, toUtcDay } from './streaks';

export type AwardCategory =
  | 'streak'
  | 'logging'
  | 'protein'
  | 'precision'
  | 'weight'
  | 'milestone';

export type AwardTier = 'bronze' | 'silver' | 'gold';

export interface AwardDefinition {
  id: string;
  category: AwardCategory;
  name: string;
  description: string;
  requirement: string;
  target: number;
  unitLabel: string;
  tier: AwardTier;
  primaryColor: string;
  accentColor: string;
  symbol: string;
}

export interface AwardProgress {
  id: string;
  current: number;
  target: number;
  percentage: number;
  unlocked: boolean;
  unlockedAt: string | null;
  eligible: boolean;
}

export interface AwardEvaluationInput {
  metrics: DbDailyMetric[];
  mealLogs: DbMealLog[];
  weightLogs: DbWeightLog[];
  profileCreatedAt: string | null;
  todayIso: string;
  unlockedAwards: DbUserAward[];
}

export interface AwardEvaluation {
  definitions: AwardDefinition[];
  progress: AwardProgress[];
  unlockedCount: number;
  eligibleCount: number;
  totalCount: number;
  newlyEligible: string[];
}

const PROTEIN_TOLERANCE = 10;

export const AWARD_CATALOG: AwardDefinition[] = [
  // ---- Streak ----
  { id: 'streak_1',   category: 'streak',    name: 'First Spark',         description: 'Hit your calorie and protein targets for one day.',    requirement: '1-day streak',   target: 1,   unitLabel: 'days',  tier: 'bronze', primaryColor: '#D4FF00', accentColor: '#A8CC00', symbol: '⚡' },
  { id: 'streak_3',   category: 'streak',    name: 'Streak Starter',      description: 'Three consecutive days hitting your targets.',        requirement: '3-day streak',   target: 3,   unitLabel: 'days',  tier: 'bronze', primaryColor: '#D4FF00', accentColor: '#8FAA00', symbol: '🔥' },
  { id: 'streak_7',   category: 'streak',    name: 'One Week Strong',     description: 'Seven days in a row. A full week of discipline.',     requirement: '7-day streak',   target: 7,   unitLabel: 'days',  tier: 'silver', primaryColor: '#FF4D1C', accentColor: '#C0C0C0', symbol: '📅' },
  { id: 'streak_14',  category: 'streak',    name: 'Consistency Builder', description: 'Fourteen consecutive days. A real habit.',            requirement: '14-day streak',  target: 14,  unitLabel: 'days',  tier: 'silver', primaryColor: '#FF4D1C', accentColor: '#C0C0C0', symbol: '🏗️' },
  { id: 'streak_30',  category: 'streak',    name: 'Discipline Master',   description: 'Thirty days. One entire month of consistency.',        requirement: '30-day streak',  target: 30,  unitLabel: 'days',  tier: 'gold',   primaryColor: '#FFD700', accentColor: '#FF8C00', symbol: '💎' },
  { id: 'streak_60',  category: 'streak',    name: 'Elite Performer',     description: 'Sixty consecutive days of focus.',                    requirement: '60-day streak',  target: 60,  unitLabel: 'days',  tier: 'gold',   primaryColor: '#FFD700', accentColor: '#FF8C00', symbol: '🚀' },
  { id: 'streak_100', category: 'streak',    name: 'Unbreakable',         description: 'One hundred days. Unstoppable.',                      requirement: '100-day streak', target: 100, unitLabel: 'days',  tier: 'gold',   primaryColor: '#00E5FF', accentColor: '#00B3CC', symbol: '🛡️' },
  { id: 'streak_180', category: 'streak',    name: 'Legend',              description: 'Half a year unbroken.',                               requirement: '180-day streak', target: 180, unitLabel: 'days',  tier: 'gold',   primaryColor: '#B100FF', accentColor: '#8B00CC', symbol: '👑' },
  { id: 'streak_365', category: 'streak',    name: 'LeanIQA Champion',    description: 'A full year of mastery.',                             requirement: '365-day streak', target: 365, unitLabel: 'days',  tier: 'gold',   primaryColor: '#FF0055', accentColor: '#CC0044', symbol: '🏆' },

  // ---- Logging ----
  { id: 'log_first',  category: 'logging',   name: 'First Log',           description: 'Log your first meal.',                                requirement: '1 meal logged',    target: 1,   unitLabel: 'meals', tier: 'bronze', primaryColor: '#378ADD', accentColor: '#2060A5', symbol: '🍽️' },
  { id: 'log_25',     category: 'logging',   name: 'Logger',              description: 'Log 25 meals.',                                       requirement: '25 meals logged',  target: 25,  unitLabel: 'meals', tier: 'silver', primaryColor: '#378ADD', accentColor: '#2060A5', symbol: '📝' },
  { id: 'log_100',    category: 'logging',   name: 'Century',             description: 'Log 100 meals.',                                      requirement: '100 meals logged', target: 100, unitLabel: 'meals', tier: 'gold',   primaryColor: '#378ADD', accentColor: '#2060A5', symbol: '📚' },

  // ---- Protein ----
  { id: 'protein_first',    category: 'protein', name: 'Protein Check', description: 'Hit your protein target once.',           requirement: '1 day at protein',      target: 1,  unitLabel: 'days', tier: 'bronze', primaryColor: '#378ADD', accentColor: '#2060A5', symbol: '🥚' },
  { id: 'protein_7_streak', category: 'protein', name: 'Protein Week',  description: 'Seven days in a row hitting protein.',     requirement: '7-day protein streak',  target: 7,  unitLabel: 'days', tier: 'silver', primaryColor: '#378ADD', accentColor: '#2060A5', symbol: '🍗' },
  { id: 'protein_30_total', category: 'protein', name: 'Protein Habit', description: 'Hit protein on 30 separate days.',         requirement: '30 protein days',       target: 30, unitLabel: 'days', tier: 'gold',   primaryColor: '#378ADD', accentColor: '#2060A5', symbol: '💪' },

  // ---- Precision ----
  { id: 'precision_90_first',    category: 'precision', name: 'Precision',    description: 'Score 90 or higher on a day.',            requirement: 'Score ≥ 90 once',  target: 1, unitLabel: 'days', tier: 'bronze', primaryColor: '#D4FF00', accentColor: '#A8CC00', symbol: '🎯' },
  { id: 'precision_90_5_streak', category: 'precision', name: 'Sharpshooter', description: 'Score 90 or higher five days in a row.',  requirement: '5-day 90+ streak', target: 5, unitLabel: 'days', tier: 'silver', primaryColor: '#D4FF00', accentColor: '#A8CC00', symbol: '🏹' },
  { id: 'precision_100_first',   category: 'precision', name: 'Flawless',     description: 'Score a perfect 100 on a day.',           requirement: 'Score 100 once',   target: 1, unitLabel: 'days', tier: 'gold',   primaryColor: '#D4FF00', accentColor: '#A8CC00', symbol: '✨' },

  // ---- Weight ----
  { id: 'weight_first',    category: 'weight', name: 'Baseline Set',   description: 'Log your weight for the first time.', requirement: '1 weight log',   target: 1,  unitLabel: 'logs', tier: 'bronze', primaryColor: '#7F77DD', accentColor: '#5A53A8', symbol: '⚖️' },
  { id: 'weight_30_total', category: 'weight', name: 'Tracking Scale', description: 'Log your weight 30 times.',           requirement: '30 weight logs', target: 30, unitLabel: 'logs', tier: 'silver', primaryColor: '#7F77DD', accentColor: '#5A53A8', symbol: '📈' },

  // ---- Milestone ----
  { id: 'first_week_complete',  category: 'milestone', name: 'First Week',  description: 'Seven days since you started.',  requirement: '7 days since signup',  target: 7,  unitLabel: 'days', tier: 'bronze', primaryColor: '#D4FF00', accentColor: '#A8CC00', symbol: '🌱' },
  { id: 'first_month_complete', category: 'milestone', name: 'First Month', description: 'Thirty days since you started.', requirement: '30 days since signup', target: 30, unitLabel: 'days', tier: 'silver', primaryColor: '#D4FF00', accentColor: '#A8CC00', symbol: '🌳' },
];

export const AWARD_BY_ID: Record<string, AwardDefinition> = Object.fromEntries(
  AWARD_CATALOG.map((a) => [a.id, a]),
);

function isProteinHit(m: DbDailyMetric): boolean {
  return m.actual_protein > 0 && m.actual_protein >= m.target_protein - PROTEIN_TOLERANCE;
}

function isScore90(m: DbDailyMetric): boolean {
  return m.score >= 90;
}

function isScore100(m: DbDailyMetric): boolean {
  return m.score === 100;
}

function countProteinDays(metrics: DbDailyMetric[]): number {
  return metrics.filter(isProteinHit).length;
}

function countScore90Days(metrics: DbDailyMetric[]): number {
  return metrics.filter(isScore90).length;
}

function countScore100Days(metrics: DbDailyMetric[]): number {
  return metrics.filter(isScore100).length;
}

function daysSinceSignup(profileCreatedAt: string | null, todayIso: string): number {
  if (!profileCreatedAt) return 0;
  const createdDay = toUtcDay(profileCreatedAt);
  const todayDay = toUtcDay(todayIso);
  return Math.max(0, todayDay - createdDay);
}

function computeRawCurrent(def: AwardDefinition, input: AwardEvaluationInput): number {
  switch (def.id) {
    case 'streak_1':
    case 'streak_3':
    case 'streak_7':
    case 'streak_14':
    case 'streak_30':
    case 'streak_60':
    case 'streak_100':
    case 'streak_180':
    case 'streak_365':
      return calculateBestStreak(input.metrics, isDailyGoalMet);

    case 'log_first':
    case 'log_25':
    case 'log_100':
      return input.mealLogs.length;

    case 'protein_first':
    case 'protein_30_total':
      return countProteinDays(input.metrics);
    case 'protein_7_streak':
      return calculateBestStreak(input.metrics, isProteinHit);

    case 'precision_90_first':
      return countScore90Days(input.metrics);
    case 'precision_90_5_streak':
      return calculateBestStreak(input.metrics, isScore90);
    case 'precision_100_first':
      return countScore100Days(input.metrics);

    case 'weight_first':
    case 'weight_30_total':
      return input.weightLogs.length;

    case 'first_week_complete':
    case 'first_month_complete':
      return daysSinceSignup(input.profileCreatedAt, input.todayIso);

    default:
      return 0;
  }
}

export function evaluateAwards(input: AwardEvaluationInput): AwardEvaluation {
  const unlockedAtMap: Record<string, string | null> = {};
  for (const row of input.unlockedAwards) {
    unlockedAtMap[row.award_id] = row.unlocked_at ?? null;
  }

  const progress: AwardProgress[] = [];
  const newlyEligible: string[] = [];
  let unlockedCount = 0;
  let eligibleCount = 0;

  for (const def of AWARD_CATALOG) {
    const raw = computeRawCurrent(def, input);
    const current = Math.min(raw, def.target);
    const eligible = raw >= def.target;
    const unlockedAt = Object.prototype.hasOwnProperty.call(unlockedAtMap, def.id)
      ? unlockedAtMap[def.id]
      : null;
    const unlocked = unlockedAt !== null;

    if (unlocked) unlockedCount++;
    if (eligible) eligibleCount++;
    if (eligible && !unlocked) newlyEligible.push(def.id);

    progress.push({
      id: def.id,
      current,
      target: def.target,
      percentage: def.target === 0 ? 100 : Math.min(100, Math.round((current / def.target) * 100)),
      unlocked,
      unlockedAt,
      eligible,
    });
  }

  return {
    definitions: AWARD_CATALOG,
    progress,
    unlockedCount,
    eligibleCount,
    totalCount: AWARD_CATALOG.length,
    newlyEligible,
  };
}

export function nextClosestAward(evaluation: AwardEvaluation): AwardProgress | null {
  const locked = evaluation.progress.filter((p) => !p.eligible && p.current > 0);
  if (locked.length === 0) return null;
  locked.sort((a, b) => b.percentage - a.percentage);
  return locked[0];
}