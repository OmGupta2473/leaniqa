import type { DbWeeklyReport, WeeklyDaySummary } from '@/shared/types/supabase';

export function daysCompletedInWeek(report: DbWeeklyReport): number {
  return report.day_summaries.filter((d) => d.logged && !d.isToday).length;
}
/**
 * Days that have fully finished this week (Sun through yesterday, IST).
 * - Final week → 7
 * - Live week → the day-of-week index of today (Sunday = 0, Monday = 1, Tuesday = 2, ...)
 * - Missing today → 7 (fallback)
 */
export function daysCompletedElapsed(report: DbWeeklyReport): number {
  if (report.status === 'final') return 7;
  const todayEntry = report.day_summaries.find((d) => d.isToday);
  if (!todayEntry) return 7;
  return todayEntry.dayOfWeek;
}



export interface HeroSummaryInput {
  daysWithMeals: number;
  targetProteinG: number;
  daySummaries: WeeklyDaySummary[];
}

function proteinClause(hits: number, total: number): string {
  if (hits === total) return 'Protein hit every logged day.';
  if (hits === 0) return 'Protein fell short every logged day.';
  if (hits >= Math.ceil(total * 0.7)) return `Protein hit ${hits} of ${total} days.`;
  return `Protein hit only ${hits} of ${total} days.`;
}

function calorieClause(over: number, under: number): string {
  if (over === 0 && under === 0) return 'Calories stayed on target.';
  if (over >= 3) return `Calories ran high on ${over} days.`;
  if (under >= 3) return `Calories ran low on ${under} days.`;
  if (over > under) return `Calories ran high on ${over} days.`;
  if (under > over) return `Calories ran low on ${under} days.`;
  return `Calories were off target on ${over + under} days.`;
}

export function deriveHeroSummary(input: HeroSummaryInput): string {
  if (input.daysWithMeals === 0) return 'No meals logged this week.';
  if (input.daysWithMeals <= 2) return 'Not enough data yet for a strong summary.';

  const completed = input.daySummaries.filter((d) => d.logged && !d.isToday);
  if (completed.length === 0) {
    return 'Today is in progress. Check back tomorrow for a full picture.';
  }
  const proteinHits = completed.filter(
    (d) => d.proteinG >= input.targetProteinG * 0.9,
  ).length;
  const over = completed.filter((d) => d.status === 'over').length;
  const under = completed.filter((d) => d.status === 'under').length;

  return `${proteinClause(proteinHits, completed.length)} ${calorieClause(over, under)}`;
}

export type DayBarStatus = WeeklyDaySummary['status'];

export function colorForDayBar(status: DayBarStatus): string {
  switch (status) {
    case 'on_target':
      return '#D4FF00';
    case 'under':
      return '#fbbf24';
    case 'protein_low':
      return '#fbbf24';
    case 'over':
      return '#FF4D1C';
    case 'in_progress':
      return 'rgba(212,255,0,0.35)';
    case 'not_logged':
      return 'rgba(255,255,255,0.06)';
  }
}
export interface HeroChip {
  id: 'protein' | 'calories' | 'goals';
  value: string;
  label: string;
  accent: string;
}

export function deriveHeroChips(report: DbWeeklyReport): HeroChip[] {
  if (report.days_with_meals === 0) return [];

  const logged = report.day_summaries.filter((d) => d.logged && !d.isToday);
  const total = logged.length;

  const proteinThreshold = report.target_protein_g * 0.9;
  const proteinHits = logged.filter((d) => d.proteinG >= proteinThreshold).length;

  const calorieHits = logged.filter(
    (d) =>
      d.calories >= 0.9 * report.target_calories &&
      d.calories <= 1.1 * report.target_calories,
  ).length;

  const goalDays = logged.filter((d) => d.status === 'on_target').length;

  return [
    {
      id: 'protein',
      value: `${proteinHits}/${total}`,
      label: 'Protein goal',
      accent: '#378ADD',
    },
    {
      id: 'calories',
      value: `${calorieHits}/${total}`,
      label: 'Calories in range',
      accent: '#FF4D1C',
    },
    {
      id: 'goals',
      value: `${goalDays}`,
      label: goalDays === 1 ? 'Goal day' : 'Goal days',
      accent: '#D4FF00',
    },
  ];
}

export function deriveCoachSummary(report: DbWeeklyReport): string {
  if (report.days_with_meals === 0) {
    return 'No meals logged this week yet. Log your first meal and I will start building your picture for the week.';
  }

  if (report.confidence === 'insufficient') {
    const days = report.days_with_meals;
    const remaining = 7 - days;
    return `You have logged ${days} ${days === 1 ? 'day' : 'days'} so far. Log ${remaining} more to unlock a full weekly picture. Keep going — consistency is what moves the needle, not any single day.`;
  }

  const logged = report.day_summaries.filter((d) => d.logged && !d.isToday);
  if (logged.length === 0) {
    return 'Today is in progress. Log a meal to start building this week\u2019s picture.';
  }
  const total = logged.length;
  const proteinThreshold = report.target_protein_g * 0.9;
  const proteinHits = logged.filter((d) => d.proteinG >= proteinThreshold).length;
  const overDays = logged.filter((d) => d.status === 'over').length;
  const underDays = logged.filter((d) => d.status === 'under').length;
  const onTargetDays = logged.filter((d) => d.status === 'on_target').length;
  const proteinMisses = total - proteinHits;
  const remainingDays = 7 - daysCompletedElapsed(report) - (report.status === 'live' ? 1 : 0);
  const proteinRate = proteinHits / total;
  const onTargetRate = onTargetDays / total;

  const lines: string[] = [];

  if (report.status === 'live') {
    // Live week: forward-looking. Two goals per remaining day.
    const avgProteinPerDay = Math.round(report.avg_protein_g);
    const proteinGapPerDay = Math.max(0, Math.round(report.target_protein_g - avgProteinPerDay));
    const caloriesGapPerDay = Math.round(report.target_calories - report.avg_calories);

    if (proteinRate >= 0.8) {
      lines.push(`Strong start — protein has been on target ${proteinHits} of ${total} days so far.`);
    } else if (proteinRate >= 0.5) {
      lines.push(`Protein has hit target on ${proteinHits} of ${total} days. Worth pushing it a bit higher.`);
    } else {
      lines.push(`Protein is running below target so far — only ${proteinHits} of ${total} days have hit it.`);
    }

    if (overDays >= 2) {
      lines.push(`Calories have gone over target ${overDays} ${overDays === 1 ? 'day' : 'days'} already. Trim the largest meal or skip late-night snacks.`);
    } else if (underDays >= 2) {
      lines.push(`Calories have stayed under target ${underDays} days. Add a balanced snack to close the gap.`);
    } else if (caloriesGapPerDay > 200) {
      lines.push(`You are averaging ${caloriesGapPerDay} kcal under your daily target. A protein-rich snack would close it.`);
    } else {
      lines.push('Calorie intake is tracking close to target.');
    }

    if (remainingDays > 0) {
      const nextGoalProtein = proteinGapPerDay > 15
        ? `${proteinGapPerDay}g more protein per day`
        : 'keep protein where it is';
      lines.push(`For the ${remainingDays} ${remainingDays === 1 ? 'day' : 'days'} left: aim to ${nextGoalProtein} and stay within 10% of your calorie target.`);
    } else {
      lines.push('This is the final day of the week — land within 10% of your target and close it out strong.');
    }
  } else {
    // Final week: reflective. 5–6 lines.
    let opener: string;
    if (report.weekly_score >= 85) opener = 'A strong week overall.';
    else if (report.weekly_score >= 70) opener = 'Solid week with a few places to tighten up.';
    else if (report.weekly_score >= 50) opener = 'Mixed week — consistency was the main gap.';
    else opener = 'A tough week, but every logged day is useful data.';
    lines.push(opener);

    if (proteinRate >= 0.8) {
      lines.push(`Protein was your anchor — ${proteinHits} of ${total} days hit target.`);
    } else if (proteinRate >= 0.5) {
      lines.push(`Protein landed on ${proteinHits} of ${total} days. The gap is worth closing next week.`);
    } else {
      lines.push(`Protein was the weak spot — only ${proteinHits} of ${total} days hit target.`);
    }

    if (overDays >= 3) {
      lines.push(`Calories ran over target on ${overDays} days. The largest overages were usually your biggest meal of the day.`);
    } else if (underDays >= 3) {
      lines.push(`Calories stayed under target on ${underDays} days, which can cost you energy and muscle over time.`);
    } else if (onTargetRate >= 0.6) {
      lines.push(`Calorie intake stayed close to target on ${onTargetDays} of ${total} days — that is the pattern to protect.`);
    } else {
      lines.push('Calorie intake moved around a lot. Aiming for a narrower window will smooth out progress.');
    }

    if (total < 6) {
      lines.push(`You logged ${total} of 7 days. Logging consistency is the fastest thing to improve — even partial logs count.`);
    } else if (total === 7) {
      lines.push('You logged all 7 days. That level of visibility is what makes the plan work.');
    }

    let recommendation: string;
    if (overDays >= 2) {
      recommendation = 'Focus for next week: keep dinner within 150 kcal of your daily target.';
    } else if (proteinMisses >= 3) {
      recommendation = 'Focus for next week: add a 25–30g protein source to breakfast on weekdays.';
    } else if (underDays >= 2) {
      recommendation = 'Focus for next week: plan a mid-afternoon snack so you land closer to your calorie target.';
    } else if (total < 5) {
      recommendation = 'Focus for next week: log at least one meal before noon every day.';
    } else {
      recommendation = 'Focus for next week: maintain this pattern — it is working.';
    }
    lines.push(recommendation);
  }

  return lines.join(' ');
}