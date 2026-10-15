import type { DbWeeklyReport, WeeklyDaySummary } from '@/shared/types/supabase';
import { daysCompletedElapsed, daysCompletedInWeek } from './weeklyPresentation';

export interface Insight {
  id: string;
  kind: 'positive' | 'warning' | 'info';
  title: string;
  body: string;
}

export interface NextAction {
  id: string;
  text: string;
}

export interface PatternObservation {
  id: string;
  title: string;
  body: string;
}

export interface MacroBalance {
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
  targetProteinPct: number;
  targetCarbsPct: number;
  targetFatPct: number;
  biggestGapKey: 'protein' | 'carbs' | 'fat' | 'none';
}

function loggedDays(report: DbWeeklyReport): WeeklyDaySummary[] {
  return report.day_summaries.filter((d) => d.logged && !d.isToday);
}

function countProteinHits(report: DbWeeklyReport): number {
  const threshold = report.target_protein_g * 0.9;
  return loggedDays(report).filter((d) => d.proteinG >= threshold).length;
}

function countByStatus(
  report: DbWeeklyReport,
  status: WeeklyDaySummary['status'],
): number {
  return report.day_summaries.filter((d) => d.status === status).length;
}

export function deriveInsights(report: DbWeeklyReport): Insight[] {
  if (report.days_with_meals === 0) return [];

  const insights: Insight[] = [];
  const logged = daysCompletedInWeek(report);
  const proteinHits = countProteinHits(report);
  const overDays = countByStatus(report, 'over');
  const underDays = countByStatus(report, 'under');
  const onTargetDays = countByStatus(report, 'on_target');

  if (onTargetDays === 7) {
    insights.push({
      id: 'perfect_week',
      kind: 'positive',
      title: 'Every day on target',
      body: 'All seven days landed within your calorie and protein windows. Outstanding consistency.',
    });
  }

  if (proteinHits >= 5) {
    insights.push({
      id: 'protein_strong',
      kind: 'positive',
      title: 'Strong protein consistency',
      body: `You hit at least 90% of your protein target on ${proteinHits} of ${logged} logged days.`,
    });
  } else if (
    logged >= (report.status === 'live' ? 2 : 3) &&
    proteinHits <= Math.floor(logged / 2)
  ) {
    insights.push({
      id: 'protein_short',
      kind: 'warning',
      title: 'Protein fell short',
      body: `You hit 90% of your protein target on only ${proteinHits} of ${logged} logged days. Adding a protein source earlier in the day will help.`,
    });
  }

  if (overDays >= 3) {
    insights.push({
      id: 'calories_over',
      kind: 'warning',
      title: `Calories ran high on ${overDays} days`,
      body: 'On those days your intake was more than 10% above target. Dinner was often the largest meal.',
    });
  }

  if (underDays >= 3) {
    insights.push({
      id: 'calories_under',
      kind: 'warning',
      title: `Calories ran low on ${underDays} days`,
      body: 'Eating well below target can cost you energy and muscle. Aim to land within 10% of target every day.',
    });
  }

  const completedElapsed = daysCompletedElapsed(report);
  if (completedElapsed === 0) {
    // No completed days yet — skip the logging check entirely.
  } else {
    const expectedLogs = Math.ceil(completedElapsed * 0.7);
    if (logged < expectedLogs) {
      const suffix = report.status === 'live' ? ' so far' : '';
      insights.push({
        id: 'logging_limited',
        kind: 'warning',
        title: 'Logging was limited',
        body: `You logged meals on ${logged} of ${completedElapsed} completed days${suffix}, so weekly averages may not reflect your full intake.`,
      });
    }
  }

  const order = { positive: 0, warning: 1, info: 2 } as const;
  insights.sort((a, b) => order[a.kind] - order[b.kind]);
  return insights.slice(0, 4);
}

export function deriveNextActions(report: DbWeeklyReport): NextAction[] {
  if (report.days_with_meals === 0) return [];
  if (report.confidence === 'insufficient') return [];

  const actions: NextAction[] = [];
  const logged = daysCompletedInWeek(report);
  const proteinHits = countProteinHits(report);
  const overDays = countByStatus(report, 'over');
  const underDays = countByStatus(report, 'under');

  if (proteinHits < Math.ceil(logged * 0.7)) {
    actions.push({
      id: 'action_protein',
      text: 'Add a 25\u201330 g protein source to breakfast on weekdays.',
    });
  }

  if (overDays >= 2) {
    actions.push({
      id: 'action_over',
      text: 'Keep dinner within 150 kcal of your daily target.',
    });
  }

  if (underDays >= 2) {
    actions.push({
      id: 'action_under',
      text: 'Plan a mid-afternoon snack to land closer to your calorie target.',
    });
  }

  if (logged < 5) {
    actions.push({
      id: 'action_logging',
      text: 'Log at least one meal before noon on the days you currently miss.',
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: 'action_maintain',
      text: 'Maintain this week\u2019s pattern \u2014 you are on track.',
    });
  }

  return actions.slice(0, 3);
}

export function derivePatterns(report: DbWeeklyReport): PatternObservation[] {
  const logged = loggedDays(report);
  if (logged.length < 3) return [];

  const patterns: PatternObservation[] = [];

  const weekends = logged.filter((d) => d.dayOfWeek === 0 || d.dayOfWeek === 6);
  const weekdays = logged.filter((d) => d.dayOfWeek >= 1 && d.dayOfWeek <= 5);

  if (weekends.length >= 1 && weekdays.length >= 1) {
    const weekendAvg =
      weekends.reduce((sum, d) => sum + d.calories, 0) / weekends.length;
    const weekdayAvg =
      weekdays.reduce((sum, d) => sum + d.calories, 0) / weekdays.length;
    const diff = weekendAvg - weekdayAvg;
    if (Math.abs(diff) >= 300) {
      patterns.push({
        id: 'weekend_weekday',
        title: 'Weekdays vs weekends',
        body: `Weekdays averaged ${Math.round(weekdayAvg).toLocaleString()} kcal, weekends ${Math.round(weekendAvg).toLocaleString()} kcal.`,
      });
    }
  }

  let largest: { day: WeeklyDaySummary; gap: number } | null = null;
  for (const d of logged) {
    const gap = d.calories - report.target_calories;
    if (largest === null || Math.abs(gap) > Math.abs(largest.gap)) {
      largest = { day: d, gap };
    }
  }

  if (largest !== null && Math.abs(largest.gap) >= 500) {
    const direction = largest.gap > 0 ? 'above' : 'below';
    patterns.push({
      id: 'largest_deviation',
      title: 'Largest single-day swing',
      body: `Your biggest deviation was ${Math.abs(Math.round(largest.gap)).toLocaleString()} kcal ${direction} target.`,
    });
  }

  return patterns.slice(0, 2);
}
/**
 * Largest-remainder rounding for three percentages that must sum to exactly 100.
 * Floor each exact percentage, then distribute the leftover points to the
 * largest fractional remainders. Ties broken in the fixed order:
 * protein (index 0), carbs (index 1), fat (index 2).
 *
 * Caller guarantees `values` are non-negative and `total > 0`.
 */
function largestRemainderPercents(
  values: [number, number, number],
  total: number,
): [number, number, number] {
  const exact = values.map((v) => (v / total) * 100);
  const floors: [number, number, number] = [
    Math.floor(exact[0]),
    Math.floor(exact[1]),
    Math.floor(exact[2]),
  ];
  const remainders = exact.map((v, i) => ({
    index: i,
    remainder: v - floors[i],
  }));
  const leftover = 100 - (floors[0] + floors[1] + floors[2]);

  const sorted = [...remainders].sort((a, b) => {
    if (b.remainder !== a.remainder) return b.remainder - a.remainder;
    return a.index - b.index;
  });

  const result: [number, number, number] = [floors[0], floors[1], floors[2]];
  for (let k = 0; k < leftover; k++) {
    result[sorted[k].index] += 1;
  }
  return result;
}

export function deriveMacroBalance(report: DbWeeklyReport): MacroBalance {
  const proteinKcal = report.total_protein_g * 4;
  const carbsKcal = report.total_carbs_g * 4;
  const fatKcal = report.total_fat_g * 9;
  const total = proteinKcal + carbsKcal + fatKcal;

  const targetProteinKcal = report.target_protein_g * 4;
  const targetCarbsKcal = report.target_carbs_g * 4;
  const targetFatKcal = report.target_fat_g * 9;
  const targetTotal = targetProteinKcal + targetCarbsKcal + targetFatKcal;

  if (total === 0 || targetTotal === 0) {
    return {
      proteinPct: 0,
      carbsPct: 0,
      fatPct: 0,
      targetProteinPct: 0,
      targetCarbsPct: 0,
      targetFatPct: 0,
      biggestGapKey: 'none',
    };
  }

  const [proteinPct, carbsPct, fatPct] = largestRemainderPercents(
    [proteinKcal, carbsKcal, fatKcal],
    total,
  );
  const [targetProteinPct, targetCarbsPct, targetFatPct] = largestRemainderPercents(
    [targetProteinKcal, targetCarbsKcal, targetFatKcal],
    targetTotal,
  );

  const gaps: Array<{ key: 'protein' | 'carbs' | 'fat'; value: number }> = [
    { key: 'protein', value: Math.abs(proteinPct - targetProteinPct) },
    { key: 'carbs', value: Math.abs(carbsPct - targetCarbsPct) },
    { key: 'fat', value: Math.abs(fatPct - targetFatPct) },
  ];

  gaps.sort((a, b) => b.value - a.value);
  const biggestGapKey = gaps[0].value > 0 ? gaps[0].key : 'none';

  return {
    proteinPct,
    carbsPct,
    fatPct,
    targetProteinPct,
    targetCarbsPct,
    targetFatPct,
    biggestGapKey,
  };
}

// ── Best day ──────────────────────────────────────────────────────────────

export interface BestDayResult {
  date: string;
  dayName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  targetCalories: number;
  targetProteinG: number;
  headline: string;
  whatWorked: string;
  repeatIt: string;
}

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

/**
 * Names the day with the highest adherence and produces two short lines:
 * one about what worked, one about what to repeat. Returns null when no
 * completed days exist, so the card can render nothing for a fresh week.
 */
export function deriveBestDay(report: DbWeeklyReport): BestDayResult | null {
  const completed = report.day_summaries.filter((d) => d.logged && !d.isToday);
  if (completed.length === 0) return null;

  const proteinTarget = report.target_protein_g;

  const sorted = [...completed].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aRatio = proteinTarget > 0 ? a.proteinG / proteinTarget : 0;
    const bRatio = proteinTarget > 0 ? b.proteinG / proteinTarget : 0;
    return bRatio - aRatio;
  });

  const best = sorted[0];
  const dayName = DAY_NAMES[best.dayOfWeek] ?? 'Best day';

  const proteinMet = proteinTarget > 0 && best.proteinG >= proteinTarget * 0.95;
  const caloriesInRange =
    best.calories >= report.target_calories * 0.9 &&
    best.calories <= report.target_calories * 1.1;

  let whatWorked: string;
  if (proteinMet && caloriesInRange) {
    whatWorked = `You hit ${Math.round(best.proteinG)}g protein and landed at ${best.calories} kcal — both targets on the same day.`;
  } else if (proteinMet) {
    whatWorked = `You hit ${Math.round(best.proteinG)}g protein — your strongest protein day this week.`;
  } else if (caloriesInRange) {
    whatWorked = `You landed at ${best.calories} kcal, right inside your target window.`;
  } else {
    whatWorked = `You logged every meal — that consistency is what moves the needle.`;
  }

  let repeatIt: string;
  if (proteinMet && caloriesInRange) {
    repeatIt = `Match ${dayName} — same portion sizes, same protein sources.`;
  } else if (proteinMet) {
    repeatIt = `Keep protein above ${Math.round(proteinTarget * 0.95)}g on weekdays.`;
  } else if (caloriesInRange) {
    repeatIt = `Match ${dayName}'s portion sizes at dinner.`;
  } else {
    repeatIt = `Log every meal again next week — the numbers tune themselves.`;
  }

  return {
    date: best.date,
    dayName,
    calories: best.calories,
    proteinG: best.proteinG,
    carbsG: best.carbsG,
    fatG: best.fatG,
    targetCalories: report.target_calories,
    targetProteinG: report.target_protein_g,
    headline: `${dayName} was your best day.`,
    whatWorked,
    repeatIt,
  };
}