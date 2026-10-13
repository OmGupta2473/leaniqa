import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getWeekStart, shiftWeek } from '../src/shared/utils/weekKey';
import {
  getKolkataDateString,
  kolkataDateStringToUtcMidnight,
  shiftKolkataDateString,
} from '../src/shared/utils/timezone';
import { computeWeeklyReport } from '../src/shared/utils/weeklyEngine';
import type { DbMealLog, DbWeightLog } from '../src/shared/types/supabase';

export interface ParsedArgs {
  weeks: number;
  execute: boolean;
}

export interface BackfillRange {
  earliestWeekStart: string;
  latestWeekStart: string;
  lastCompleteSaturday: string;
}

interface TargetRow {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface ProfileRow {
  id: string;
  target_kcal: number | null;
  protein_target: number | null;
  carbs_target: number | null;
  fat_target: number | null;
}

export function parseArgs(argv: string[]): ParsedArgs {
  let weeks = 12;
  let execute = false;
  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    if (arg === '--weeks') {
      const next = argv[i + 1];
      if (next === undefined) throw new Error('--weeks requires a value');
      if (!/^\d+$/.test(next)) throw new Error('--weeks must be a positive integer');
      const n = Number(next);
      if (!Number.isInteger(n) || n < 1 || n > 52) {
        throw new Error('--weeks must be an integer between 1 and 52');
      }
      weeks = n;
      i += 2;
    } else if (arg === '--execute') {
      execute = true;
      i += 1;
    } else {
      throw new Error('Unknown argument');
    }
  }
  return { weeks, execute };
}

export function computeBackfillRange(todayIst: string, weeks: number): BackfillRange {
  if (!Number.isInteger(weeks) || weeks < 1) {
    throw new Error('weeks must be a positive integer');
  }
  const currentWeekStart = getWeekStart(todayIst);
  const latestWeekStart = shiftWeek(currentWeekStart, -1);
  const lastCompleteSaturday = shiftKolkataDateString(latestWeekStart, 6);
  const earliestWeekStart = shiftWeek(latestWeekStart, -(weeks - 1));
  return { earliestWeekStart, latestWeekStart, lastCompleteSaturday };
}

export async function writeOneWeek(
  client: SupabaseClient,
  userId: string,
  weekStart: string,
  weekEnd: string,
  meals: DbMealLog[],
  weightLogs: DbWeightLog[],
  targets: TargetRow,
  nowIsoDate: string,
): Promise<'written' | 'failed'> {
  const result = computeWeeklyReport({
    weekStart,
    weekEnd,
    nowIsoDate,
    meals,
    weightLogs,
    targets,
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
    computed_at: now,
    updated_at: now,
  };

  const { error } = await client
    .from('weekly_reports')
    .upsert(payload, { onConflict: 'user_id,week_start' })
    .select()
    .maybeSingle();
  if (error && error.code !== 'PGRST116') return 'failed';
  return 'written';
}

async function main(): Promise<void> {
  let parsed: ParsedArgs;
  try {
    parsed = parseArgs(process.argv.slice(2));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid arguments';
    process.stderr.write(`Argument error: ${msg}\n`);
    process.exit(1);
    return;
  }

  const url = process.env.VITE_SUPABASE_URL;
  if (!url) {
    process.stderr.write('Missing environment variable: VITE_SUPABASE_URL\n');
    process.exit(1);
    return;
  }
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    process.stderr.write('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY\n');
    process.exit(1);
    return;
  }

  try {
    const synthetic = computeWeeklyReport({
      weekStart: '2026-10-11',
      weekEnd: '2026-10-17',
      nowIsoDate: '2026-10-12',
      meals: [],
      weightLogs: [],
      targets: { calories: 2000, protein: 150, carbs: 200, fat: 60 },
    });
    if (synthetic.daySummaries.length !== 7) throw new Error('bad output');
  } catch {
    process.stderr.write('Engine sanity check failed\n');
    process.exit(1);
    return;
  }

  const range = computeBackfillRange(getKolkataDateString(), parsed.weeks);
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const mealFrom = kolkataDateStringToUtcMidnight(range.earliestWeekStart).toISOString();
  const mealTo = kolkataDateStringToUtcMidnight(
    shiftKolkataDateString(range.lastCompleteSaturday, 1),
  ).toISOString();

  const { data: meals, error: mealsError } = await supabase
    .from('meal_logs')
    .select('id, user_id, meal_text, meal_time, calories, protein, fat, carbs')
    .gte('meal_time', mealFrom)
    .lt('meal_time', mealTo);
  if (mealsError) {
    process.stderr.write('Query failed: meal_logs\n');
    process.exit(1);
    return;
  }

  const { data: weightLogs, error: weightError } = await supabase
    .from('weight_logs')
    .select('id, user_id, weight, date')
    .gte('date', range.earliestWeekStart)
    .lte('date', range.lastCompleteSaturday);
  if (weightError) {
    process.stderr.write('Query failed: weight_logs\n');
    process.exit(1);
    return;
  }

  const { data: reports, error: reportsError } = await supabase
    .from('weekly_reports')
    .select('user_id, week_start')
    .gte('week_start', range.earliestWeekStart)
    .lte('week_start', range.latestWeekStart);
  if (reportsError) {
    process.stderr.write('Query failed: weekly_reports\n');
    process.exit(1);
    return;
  }

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, target_kcal, protein_target, carbs_target, fat_target');
  if (profilesError) {
    process.stderr.write('Query failed: profiles\n');
    process.exit(1);
    return;
  }

  const candidateKeys = new Set<string>();
  const mealsByKey = new Map<string, DbMealLog[]>();
  for (const m of meals ?? []) {
    const day = getKolkataDateString(new Date(m.meal_time));
    const ws = getWeekStart(day);
    const k = `${m.user_id}|${ws}`;
    candidateKeys.add(k);
    const bucket = mealsByKey.get(k) ?? [];
    bucket.push(m as unknown as DbMealLog);
    mealsByKey.set(k, bucket);
  }

  const weightByKey = new Map<string, DbWeightLog[]>();
  for (const w of weightLogs ?? []) {
    const ws = getWeekStart(w.date);
    const k = `${w.user_id}|${ws}`;
    const bucket = weightByKey.get(k) ?? [];
    bucket.push(w as unknown as DbWeightLog);
    weightByKey.set(k, bucket);
  }

  const reportKeys = new Set<string>();
  for (const r of reports ?? []) reportKeys.add(`${r.user_id}|${r.week_start}`);

  const profileByUser = new Map<string, ProfileRow>();
  for (const p of profiles ?? []) profileByUser.set(p.id, p as ProfileRow);

  let alreadyHasReport = 0;
  let eligibleForUpsert = 0;
  let skippedIncompleteTargets = 0;
  const eligibleKeys: string[] = [];

  for (const k of candidateKeys) {
    if (reportKeys.has(k)) {
      alreadyHasReport += 1;
      continue;
    }
    const [userId] = k.split('|');
    const prof = profileByUser.get(userId);
    const complete =
      prof != null &&
      prof.target_kcal != null &&
      prof.protein_target != null &&
      prof.carbs_target != null &&
      prof.fat_target != null;
    if (complete) {
      eligibleForUpsert += 1;
      eligibleKeys.push(k);
    } else {
      skippedIncompleteTargets += 1;
    }
  }

  const total = candidateKeys.size;
  console.log(
    '=== Weekly Report Backfill ' + (parsed.execute ? 'Execute' : 'Dry-Run') + ' ===',
  );
  console.log(`Requested weeks: ${parsed.weeks}`);
  console.log(
    `IST date range inspected: ${range.earliestWeekStart} (Sun) to ${range.lastCompleteSaturday} (Sat)`,
  );
  console.log(`Cutoff used: last completed Saturday in IST was ${range.lastCompleteSaturday}`);
  console.log('');
  console.log(`Candidate (user, week) pairs with meals in range: ${total}`);
  console.log(`  Already have a report row: ${alreadyHasReport}`);
  console.log(`  Eligible for upsert: ${eligibleForUpsert}`);
  console.log(`  Skipped — incomplete targets: ${skippedIncompleteTargets}`);
  console.log('');

  if (!parsed.execute) {
    console.log('Mode: DRY RUN — no writes performed');
    return;
  }

  const nowIsoDate = getKolkataDateString();
  let written = 0;
  let failed = 0;

  for (const k of eligibleKeys) {
    const [userId, weekStart] = k.split('|');
    const weekEnd = shiftKolkataDateString(weekStart, 6);
    const prof = profileByUser.get(userId);
    if (!prof) {
      failed += 1;
      continue;
    }
    if (
      prof.target_kcal == null ||
      prof.protein_target == null ||
      prof.carbs_target == null ||
      prof.fat_target == null
    ) {
      failed += 1;
      continue;
    }
    const targets: TargetRow = {
      calories: prof.target_kcal,
      protein: prof.protein_target,
      carbs: prof.carbs_target,
      fat: prof.fat_target,
    };
    const mealBucket = mealsByKey.get(k) ?? [];
    const weightBucket = weightByKey.get(k) ?? [];
    try {
      const outcome = await writeOneWeek(
        supabase,
        userId,
        weekStart,
        weekEnd,
        mealBucket,
        weightBucket,
        targets,
        nowIsoDate,
      );
      if (outcome === 'written') written += 1;
      else failed += 1;
    } catch {
      failed += 1;
    }
  }

  console.log('Mode: EXECUTE — writes performed');
  console.log(`  Written: ${written}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Skipped — incomplete targets: ${skippedIncompleteTargets}`);
  console.log(`  Skipped — already existed: ${alreadyHasReport}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  void main();
}