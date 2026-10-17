/**
 * Phase 6.4 local evaluation harness.
 *
 * Runs the 34-meal Phase 6.0 eval set through the Phase 6.4 resolve()
 * function against staging. No AI, no credits, no edge function. Measures
 * resolver accuracy with the real staging data layer.
 *
 * Requirements (see README.md):
 *   - STAGING_SUPABASE_URL + STAGING_SUPABASE_SERVICE_ROLE_KEY in .env.local
 *   - EXPECTED_STAGING_REF set to the staging project ref
 *   - EVAL_TEST_USER_ID set to the throwaway evaluation user's UUID
 *
 * Usage:
 *   npx tsx scripts/phase-6.4-eval/run.ts
 *   npx tsx scripts/phase-6.4-eval/run.ts --only m01,m02
 */

import 'dotenv/config';
import { config as loadEnv } from 'dotenv';
import { writeFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import {
  resolve,
  normalizeInput,
  DEFAULT_RESOLVER_CONFIG,
} from '../../supabase/functions/_shared/foodResolver';
import type {
  ResolverConfig,
  ResolverResult,
} from '../../supabase/functions/_shared/foodResolver';
import { EVAL_SET, type EvalMeal } from '../spike/eval-set';
import { findFood } from '../spike/data/foods';
import { StagingResolverDb } from './stagingResolverDb';
import { assertStagingTarget } from '../import/_validate-target';

loadEnv({ path: '.env.local', override: true });
loadEnv({ path: '.env' });

// ---- Types --------------------------------------------------------------

interface EvalRow {
  id: string;
  text: string;
  note?: string;
  expected_kcal: number;
  expected_protein: number;
  actual_kcal: number;
  actual_protein: number;
  kcal_err_pct: number | null;
  protein_err_g: number | null;
  food_match: boolean | null;
  expected_canonical_names: string[] | null;   // NEW
  actual_canonical_names: string[];            // NEW
  layers_used: string;
  meal_confidence: number;
  requires_confirmation: boolean;
  unresolved_items: Array<{ raw_text: string; input_term: string }>;
  resolved_item_count: number;
  resolution_ms: number;
  clarify_selection_count: number;
  error: string | null;
}

// ---- CLI ----------------------------------------------------------------

function parseArgs(argv: string[]): { only: Set<string> | null; clarify: boolean } {
  let only: Set<string> | null = null;
  let clarify = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--only') {
      const next = argv[i + 1];
      if (!next) throw new Error('--only requires a comma-separated list of meal IDs');
      only = new Set(next.split(',').map((s) => s.trim()).filter(Boolean));
      i++;
    } else if (a === '--clarify') {
      clarify = true;
    } else {
      throw new Error(`Unknown argument: ${a}`);
    }
  }
  return { only, clarify };
}

// ---- Expected totals ---------------------------------------------------

function expectedTotals(meal: EvalMeal): { kcal: number; protein: number } {
  let kcal = 0;
  let protein = 0;
  for (const item of meal.expected_items) {
    const f = findFood(item.canonical);
    if (!f) throw new Error(`Eval references unknown spike food: ${item.canonical}`);
    const scale = item.grams / 100;
    kcal += f.per_100g.kcal * scale;
    protein += f.per_100g.protein * scale;
  }
  return {
    kcal: Math.round(kcal),
    protein: Math.round(protein * 10) / 10,
  };
}

function expectedCanonicalNames(meal: EvalMeal): string[] | null {
  if (meal.expected_items.length === 0) return null;
  return meal.expected_items
    .map((i) => {
      const f = findFood(i.canonical);
      if (!f) throw new Error(`Unknown spike food: ${i.canonical}`);
      return f.canonical_name;
    })
    .sort();
}

// ---- Metrics -----------------------------------------------------------

function mape(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.round(avg * 100) / 100;
}

function mae(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.round(avg * 10) / 10;
}

// ---- Main --------------------------------------------------------------

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  let target;
  try {
    target = assertStagingTarget(process.env.STAGING_SUPABASE_URL);
  } catch (err) {
    console.error(`Target check failed:\n  ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }

  const evalUserId = process.env.EVAL_TEST_USER_ID;
  if (!evalUserId) {
    console.error('EVAL_TEST_USER_ID is not set in .env.local.');
    console.error('Create a throwaway user in staging (see README.md) and set their UUID.');
    process.exit(1);
  }

  const serviceKey = process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    console.error('STAGING_SUPABASE_SERVICE_ROLE_KEY is not set in .env.local.');
    process.exit(1);
  }

  console.log(`Target:      ${target.url}`);
  console.log(`Ref:         ${target.ref}`);
  console.log(`Eval user:   ${evalUserId}`);
  console.log(`Spike meals: ${EVAL_SET.length}`);
  if (args.only) console.log(`Filter:      ${[...args.only].join(', ')}`);
  if (args.clarify) console.log('Clarify:     on (auto-selects candidates[0])');
  console.log('');

  const supabase = createClient(target.url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const db = new StagingResolverDb(supabase);

  const config: ResolverConfig = {
    ...DEFAULT_RESOLVER_CONFIG,
    memoryReadEnabled: false,
    memoryWriteEnabled: false,
  };

  const rows: EvalRow[] = [];
  const meals = args.only
    ? EVAL_SET.filter((m) => args.only!.has(m.id))
    : EVAL_SET;

  for (const meal of meals) {
    const exp = expectedTotals(meal);
    const expNames = expectedCanonicalNames(meal);

    const t0 = performance.now();
    let result: ResolverResult | null = null;
    let errMessage: string | null = null;
    let clarifySelections = 0;
    try {
      const baseInput = {
        userId: evalUserId,
        rawText: meal.text,
        normalizedText: normalizeInput(meal.text),
        mealType: 'unspecified',
      };

      result = await resolve(baseInput, db, config);

      if (args.clarify) {
        const selections: Array<{ input_term: string; food_id: number }> = [];

        for (const item of result.items) {
          if (
            item.requires_confirmation &&
            item.candidates &&
            item.candidates.length >= 2
          ) {
            selections.push({
              input_term: item.input_term,
              food_id: item.candidates[0].food_id,
            });
          }
        }

        if (selections.length > 0) {
          clarifySelections = selections.length;

          result = await resolve(
            { ...baseInput, selections },
            db,
            config,
          );
        }
      }
    } catch (err) {
      errMessage = err instanceof Error ? err.message : String(err);
    }
    const t1 = performance.now();

      if (!result) {
          rows.push({
              id: meal.id,
              text: meal.text,
              note: meal.note,
              expected_canonical_names: expNames,
              actual_canonical_names: [],
              expected_kcal: exp.kcal,
              expected_protein: exp.protein,
              actual_kcal: 0,
              actual_protein: 0,
              kcal_err_pct: null,
              protein_err_g: null,
              food_match: null,
              layers_used: '',
              meal_confidence: 0,
              requires_confirmation: false,
              unresolved_items: [],
              resolved_item_count: 0,
              resolution_ms: Math.round(t1 - t0),
              clarify_selection_count: 0,
              error: errMessage,
          });
          continue;
      }

    const actNames = result.items.map((i) => i.canonical_name).sort();
    const foodMatch = expNames === null
      ? null
      : (expNames.length === actNames.length &&
         expNames.every((n, i) => n === actNames[i]));

    const kcalErrPct = exp.kcal > 0
      ? Math.round((Math.abs(result.totals.kcal - exp.kcal) / exp.kcal) * 1000) / 10
      : null;
    const proteinErrG = exp.protein > 0
      ? Math.round(Math.abs(result.totals.protein - exp.protein) * 10) / 10
      : null;

      rows.push({
          id: meal.id,
          text: meal.text,
          note: meal.note,
          expected_canonical_names: expNames,
          actual_canonical_names: actNames,
          expected_kcal: exp.kcal,
          expected_protein: exp.protein,
          actual_kcal: result.totals.kcal,
          actual_protein: result.totals.protein,
          kcal_err_pct: kcalErrPct,
          protein_err_g: proteinErrG,
      food_match: foodMatch,
      layers_used: result.layers_used.join('|'),
      meal_confidence: result.meal_confidence,
      requires_confirmation: result.needs_confirmation,
      unresolved_items: result.unresolved_items.map((u) => ({
        raw_text: u.raw_text,
        input_term: u.input_term,
      })),
      resolved_item_count: result.items.length,
      resolution_ms: Math.round(t1 - t0),
      clarify_selection_count: clarifySelections,
      error: null,
    });
  }

  const definite = rows.filter((r) => r.expected_kcal > 0 && r.error === null);
  const ambiguous = rows.filter((r) => r.expected_kcal === 0 && r.error === null);
  const errored = rows.filter((r) => r.error !== null);

  const foodMatchable = definite.filter((r) => r.food_match !== null);
  const foodMatchAccuracy = foodMatchable.length > 0
    ? Math.round((foodMatchable.filter((r) => r.food_match).length / foodMatchable.length) * 1000) / 10
    : 0;

  const kcalMape = mape(definite.map((r) => r.kcal_err_pct!).filter((v) => v !== null));
  const kcalMae = mae(definite.map((r) => Math.abs(r.actual_kcal - r.expected_kcal)));
  const proteinMae = mae(definite.map((r) => r.protein_err_g!).filter((v) => v !== null));

  const ambiguousFlagged = ambiguous.filter((r) => r.requires_confirmation).length;
  const fullyResolved = definite.filter((r) => r.unresolved_items.length === 0).length;
  const avgMs = rows.length > 0
    ? Math.round(rows.reduce((s, r) => s + r.resolution_ms, 0) / rows.length)
    : 0;

  console.log('=== LeanIQA Phase 6.4 Eval — Local-Only Resolver ===');
  console.log('');
  console.log(`Meals attempted:         ${rows.length}`);
  console.log(`  Definite:              ${definite.length}`);
  console.log(`  Ambiguous:             ${ambiguous.length}`);
  console.log(`  Errored:               ${errored.length}`);
  console.log('');
  console.log(`Food-match accuracy:     ${foodMatchAccuracy}%  (${foodMatchable.filter((r) => r.food_match).length}/${foodMatchable.length})`);
  console.log(`Calorie MAPE:            ${kcalMape}%`);
  console.log(`Calorie MAE:             ${kcalMae} kcal`);
  console.log(`Protein MAE:             ${proteinMae} g`);
  console.log(`Fully resolved:          ${fullyResolved}/${definite.length}`);
  console.log(`Ambiguity flagged:       ${ambiguousFlagged}/${ambiguous.length}`);
  console.log(`Average resolution:      ${avgMs} ms`);
  console.log('');

  console.log('Per-meal detail:');
  const pad = (s: string, n: number) => (s + ' '.repeat(n)).slice(0, n);
  console.log('id   | text                                         | exp   | act   | err%  | match | layers              | conf | unres | ms');
  console.log('-----|----------------------------------------------|-------|-------|-------|-------|---------------------|------|-------|----');
  for (const r of rows) {
    console.log(
      pad(r.id, 4) + ' | ' +
      pad(r.text, 44) + ' | ' +
      pad(String(r.expected_kcal), 5) + ' | ' +
      pad(String(r.actual_kcal), 5) + ' | ' +
      pad(r.kcal_err_pct != null ? r.kcal_err_pct.toFixed(1) : '—', 5) + ' | ' +
      pad(r.food_match === null ? '—' : (r.food_match ? 'yes' : 'NO'), 5) + ' | ' +
      pad(r.layers_used || '—', 19) + ' | ' +
      pad(r.meal_confidence.toFixed(2), 4) + ' | ' +
      pad(String(r.unresolved_items.length), 5) + ' | ' +
      String(r.resolution_ms)
    );
    if (r.error) console.log(`     ERROR: ${r.error}`);
    if (r.food_match === false) {
  console.log(
    `     MISMATCH expected=[${(r.expected_canonical_names ?? []).join(', ')}] ` +
    `actual=[${r.actual_canonical_names.join(', ')}]`
  );
}
  }
  console.log('');
  const failures = rows.filter((r) => r.food_match === false);
if (failures.length > 0) {
  console.log('');
  console.log('=== Failure detail ===');
  console.log('');
  for (const f of failures) {
    console.log(`${f.id}  ${f.text}`);
    console.log(`  expected_canonical_names: ${JSON.stringify(f.expected_canonical_names)}`);
    console.log(`  actual_canonical_names:   ${JSON.stringify(f.actual_canonical_names)}`);
    console.log(`  layers_used:              ${f.layers_used}`);
    console.log(`  meal_confidence:          ${f.meal_confidence}`);
    console.log(`  kcal:                     exp ${f.expected_kcal} / act ${f.actual_kcal} (${f.kcal_err_pct ?? '—'}%)`);
    console.log(`  protein:                  exp ${f.expected_protein} / act ${f.actual_protein} (${f.protein_err_g ?? '—'}g)`);
    console.log(`  unresolved_items:         ${JSON.stringify(f.unresolved_items.map((u) => u.input_term))}`);
    console.log(`  resolved_item_count:      ${f.resolved_item_count}`);
    console.log('');
  }
}
  const outputPath = 'scripts/phase-6.4-eval/output.json';
  writeFileSync(outputPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    target: { url: target.url, ref: target.ref },
    evalUserId,
    config: {
      confidenceThreshold: config.confidenceThreshold,
      memoryReadEnabled: config.memoryReadEnabled,
      memoryWriteEnabled: config.memoryWriteEnabled,
      fuzzySearchMinSimilarity: config.fuzzySearchMinSimilarity,
      fuzzySearchLimit: config.fuzzySearchLimit,
      maxItemsPerMeal: config.maxItemsPerMeal,
    },
    summary: {
      mealsAttempted: rows.length,
      definite: definite.length,
      ambiguous: ambiguous.length,
      errored: errored.length,
      foodMatchAccuracy,
      kcalMape,
      kcalMae,
      proteinMae,
      fullyResolved,
      ambiguousFlagged,
      avgMs,
    },
    rows,
  }, null, 2));
  console.log(`Wrote ${outputPath}`);
  console.log('');

  process.exit(errored.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});