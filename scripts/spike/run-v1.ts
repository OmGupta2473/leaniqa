// =============================================================================
// Phase 6.7 — E3: v1 baseline runner
// =============================================================================
// Runs EVAL_SET_V2 against the current staging resolve-meal function (v5,
// the guidance-era deploy still live on staging). Writes per-case results to
// scripts/spike/v1-results.json and prints a summary.
//
// This is the v1 baseline. When R2 ships resolve-meal-v2, run-v2.ts will
// run the same eval set against it, and compare-v1-v2.ts (E4) will diff.
//
// SAFETY:
//   - Calls staging ONLY (yvtoxpsmxlrljpuqvzgv). Never production.
//   - Does not enable AI secrets. USE_HYBRID_RESOLVER=false on staging means
//     the AI path never fires. Zero credits consumed by this script.
//   - Does not modify resolve-meal, parse-meal, or the database.
//
// ENV VARS (from .env.local or shell):
//   VITE_SUPABASE_URL           (fallback: SUPABASE_URL)
//   VITE_SUPABASE_ANON_KEY      (fallback: SUPABASE_ANON_KEY)
//   TEST_USER_EMAIL             test account email on staging
//   TEST_USER_PASSWORD          test account password on staging
//
// OPTIONAL ENV:
//   EVAL_DELAY_MS     delay between calls (default 300ms) — avoids rate limits
//   EVAL_TIMEOUT_MS   per-call timeout (default 30000ms)
//   EVAL_FILTER       comma-separated case IDs to run, e.g. "m01,m02,a01"
//
// USAGE:
//   npx tsx scripts/spike/run-v1.ts
//   npx tsx scripts/spike/run-v1.ts --filter m01,m02,a01
// =============================================================================

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { EVAL_SET_V2, type EvalMealV2, type ExpectedItemV2 } from './eval-set-v2';

// ---- Env --------------------------------------------------------------------

function env(key: string, fallbackKey?: string): string | undefined {
  const v = process.env[key];
  if (v) return v;
  if (fallbackKey) return process.env[fallbackKey];
  return undefined;
}

function loadConfig() {
  const url = env('VITE_SUPABASE_URL', 'SUPABASE_URL');
  const key = env('VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY');
  const email = env('TEST_USER_EMAIL');
  const password = env('TEST_USER_PASSWORD');

  const missing: string[] = [];
  if (!url) missing.push('VITE_SUPABASE_URL (or SUPABASE_URL)');
  if (!key) missing.push('VITE_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY)');
  if (!email) missing.push('TEST_USER_EMAIL');
  if (!password) missing.push('TEST_USER_PASSWORD');

  if (missing.length > 0) {
    console.error('\nMissing required env vars:');
    for (const m of missing) console.error(`  - ${m}`);
    console.error('\nAdd them to .env.local, e.g.:');
    console.error('  VITE_SUPABASE_URL=https://yvtoxpsmxlrljpuqvzgv.supabase.co');
    console.error('  VITE_SUPABASE_ANON_KEY=<staging anon key>');
    console.error('  TEST_USER_EMAIL=test@example.com');
    console.error('  TEST_USER_PASSWORD=****');
    console.error('\nThen run again with dotenv-cli or via vite-node:');
    console.error('  npx dotenv-cli -e .env.local -- npx tsx scripts/spike/run-v1.ts');
    process.exit(1);
  }

  return {
    url: url!,
    key: key!,
    email: email!,
    password: password!,
    delayMs: Number(env('EVAL_DELAY_MS') ?? 300),
    timeoutMs: Number(env('EVAL_TIMEOUT_MS') ?? 30000),
  };
}

// ---- Types ------------------------------------------------------------------

interface ResolvedItemV5 {
  food_id: number | null;
  canonical_name: string;
  category: string | null;
  quantity: number;
  unit: string | null;
  grams: number;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  confidence: number;
  layer: string;
  resolution_type: string;
  requires_confirmation: boolean;
  candidates?: Array<{ food_id: number; display_name: string }>;
}

interface ResolveMealResponseV5 {
  items: ResolvedItemV5[];
  unresolved_items: Array<{ input_term: string; quantity: number; unit: string | null }>;
  totals: { kcal: number; protein: number; fat: number; carbs: number; fiber: number };
  meal_confidence: number;
  needs_confirmation: boolean;
  layers_used: string[];
  metadata?: { resolution_ms: number; memory_hit: boolean; popular_hit: boolean };
  source?: string;
  request_id?: string;
  guidance_message?: string | null;
  guidance_kinds?: string[];
}

interface ItemScore {
  expected: ExpectedItemV2;
  resolved: ResolvedItemV5 | null;
  food_ok: boolean;
  grams_ok: boolean;
}

interface CaseScore {
  id: string;
  text: string;
  items: ItemScore[];
  food_match: boolean;
  grams_match: boolean;
  unresolved_ok: boolean;
  ambiguity_ok: boolean;
  pass: boolean;
  was_ambiguous_any: boolean;
  ai_used: boolean;
  latency_ms: number;
  error: string | null;
}

interface ResultRow extends CaseScore {
  expected_items: ExpectedItemV2[];
  resolved_items: ResolvedItemV5[];
  totals: { kcal: number; protein: number } | null;
  guidance_message: string | null;
  unresolved_count: number;
  raw_layers_used: string[];
  source: string | null;
}

// ---- Resolver call ----------------------------------------------------------

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms,
    );
    p.then((v) => { clearTimeout(timer); resolve(v); },
           (e) => { clearTimeout(timer); reject(e); });
  });
}

function deriveWasAmbiguous(r: ResolveMealResponseV5): boolean {
  if (r.guidance_message) return true;
  if (r.needs_confirmation) return true;
  return r.items.some(
    (i) => i.layer === 'ambiguous' || (i.candidates?.length ?? 0) >= 2,
  );
}

function deriveAiUsed(r: ResolveMealResponseV5): boolean {
  if (r.source === 'hybrid') return true;
  return (r.layers_used ?? []).includes('ai_fallback');
}

// ---- Scoring ----------------------------------------------------------------

function matchesExpected(exp: ExpectedItemV2, got: ResolvedItemV5): boolean {
  if (exp.food_id !== undefined && got.food_id === exp.food_id) return true;
  if (exp.category !== undefined && got.category === exp.category) return true;
  if (
    exp.canonical_contains &&
    got.canonical_name.toLowerCase().includes(exp.canonical_contains.toLowerCase())
  ) return true;
  return false;
}

function checkGrams(exp: ExpectedItemV2, gotGrams: number): boolean {
  if (exp.grams_any) return gotGrams > 0;
  if (exp.grams_exact !== undefined) {
    const tol = Math.max(exp.grams_exact * 0.05, 5);
    return Math.abs(gotGrams - exp.grams_exact) <= tol;
  }
  if (exp.grams_min !== undefined && gotGrams < exp.grams_min) return false;
  if (exp.grams_max !== undefined && gotGrams > exp.grams_max) return false;
  return true;
}

function scoreMeal(
  expected: EvalMealV2,
  response: ResolveMealResponseV5,
  latency_ms: number,
): CaseScore {
  const used = new Set<number>();
  const itemScores: ItemScore[] = [];

  for (const exp of expected.expected_items) {
    const idx = response.items.findIndex(
      (r, i) => !used.has(i) && matchesExpected(exp, r),
    );
    if (idx === -1) {
      itemScores.push({ expected: exp, resolved: null, food_ok: false, grams_ok: false });
      continue;
    }
    used.add(idx);
    const got = response.items[idx];
    itemScores.push({
      expected: exp,
      resolved: got,
      food_ok: true,
      grams_ok: checkGrams(exp, got.grams),
    });
  }

  const food_match = itemScores.every((s) => s.food_ok);
  const grams_match = itemScores.every((s) => s.grams_ok);
  const unresolved_ok =
    expected.expected_items.length === 0 || response.unresolved_items.length === 0;

  const was_ambiguous_any = deriveWasAmbiguous(response);
  const ambiguity_ok =
    !expected.expect_was_ambiguous || was_ambiguous_any === true;

  const pass = food_match && grams_match && unresolved_ok && ambiguity_ok;

  return {
    id: expected.id,
    text: expected.text,
    items: itemScores,
    food_match,
    grams_match,
    unresolved_ok,
    ambiguity_ok,
    pass,
    was_ambiguous_any,
    ai_used: deriveAiUsed(response),
    latency_ms,
    error: null,
  };
}

// ---- Per-case runner --------------------------------------------------------

async function runCase(
  client: ReturnType<typeof createClient>,
  expected: EvalMealV2,
  timeoutMs: number,
): Promise<ResultRow> {
  const started = Date.now();
  try {
    const resp = await withTimeout(
      client.functions.invoke<ResolveMealResponseV5>('resolve-meal', {
        body: { text: expected.text, mealType: 'unspecified' },
      }),
      timeoutMs,
      `case ${expected.id}`,
    );
    const latency_ms = Date.now() - started;

    if (resp.error) {
      throw new Error(resp.error.message ?? 'function error');
    }
    const data = resp.data;
    if (!data || !Array.isArray(data.items)) {
      throw new Error('invalid response shape');
    }

    const score = scoreMeal(expected, data, latency_ms);
    return {
      ...score,
      expected_items: expected.expected_items,
      resolved_items: data.items,
      totals: data.totals ? { kcal: data.totals.kcal, protein: data.totals.protein } : null,
      guidance_message: data.guidance_message ?? null,
      unresolved_count: data.unresolved_items.length,
      raw_layers_used: data.layers_used ?? [],
      source: data.source ?? null,
    };
  } catch (err) {
    const latency_ms = Date.now() - started;
    const msg = err instanceof Error ? err.message : String(err);
    return {
      id: expected.id,
      text: expected.text,
      items: expected.expected_items.map((exp) => ({
        expected: exp,
        resolved: null,
        food_ok: false,
        grams_ok: false,
      })),
      food_match: false,
      grams_match: false,
      unresolved_ok: false,
      ambiguity_ok: !expected.expect_was_ambiguous,
      pass: false,
      was_ambiguous_any: false,
      ai_used: false,
      latency_ms,
      error: msg,
      expected_items: expected.expected_items,
      resolved_items: [],
      totals: null,
      guidance_message: null,
      unresolved_count: 0,
      raw_layers_used: [],
      source: null,
    };
  }
}

// ---- Summary printer --------------------------------------------------------

function percentile(xs: number[], p: number): number {
  if (xs.length === 0) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const idx = Math.floor((sorted.length - 1) * p);
  return sorted[idx];
}

function printSummary(rows: ResultRow[]) {
  const total = rows.length;
  const passed = rows.filter((r) => r.pass).length;
  const foodOk = rows.filter((r) => r.food_match).length;
  const gramsOk = rows.filter((r) => r.grams_match).length;
  const ambigOk = rows.filter((r) => r.ambiguity_ok).length;
  const unresolvedRows = rows.filter((r) => r.unresolved_count > 0).length;
  const aiRows = rows.filter((r) => r.ai_used).length;
  const errored = rows.filter((r) => r.error !== null).length;
  const latencies = rows.map((r) => r.latency_ms);

  const pct = (n: number) => `${((n / total) * 100).toFixed(1)}%`;

  console.log('\n========== run-v1 results ==========');
  console.log(`Total cases:       ${total}`);
  console.log(`Passed:            ${passed}/${total} (${pct(passed)})`);
  console.log(`Food match:        ${foodOk}/${total} (${pct(foodOk)})`);
  console.log(`Grams match:       ${gramsOk}/${total} (${pct(gramsOk)})`);
  console.log(`Ambiguity match:   ${ambigOk}/${total} (${pct(ambigOk)})`);
  console.log(`With unresolved:   ${unresolvedRows}/${total} (${pct(unresolvedRows)})`);
  console.log(`AI used:           ${aiRows}/${total} (${pct(aiRows)})  [expect 0 — USE_HYBRID_RESOLVER=false on staging]`);
  console.log(`Errors:            ${errored}/${total}`);
  console.log(
    `Latency (ms):      avg=${Math.round(latencies.reduce((a, b) => a + b, 0) / total)} ` +
    `p50=${percentile(latencies, 0.5)} p95=${percentile(latencies, 0.95)}`,
  );

  console.log('\n========== per-case ==========');
  for (const r of rows) {
    const tag = r.pass ? 'PASS' : 'FAIL';
    const bits: string[] = [];
    if (r.error) bits.push(`error: ${r.error}`);
    if (!r.food_match) bits.push('food mismatch');
    if (!r.grams_match) bits.push('grams mismatch');
    if (!r.unresolved_ok) bits.push(`unresolved=${r.unresolved_count}`);
    if (!r.ambiguity_ok) bits.push('ambiguity not flagged');
    const suffix = bits.length > 0 ? `  [${bits.join('; ')}]` : '';
    console.log(`  ${tag}  ${r.id.padEnd(8)} ${r.text}${suffix}`);
  }
  console.log('');
}

// ---- Main -------------------------------------------------------------------

async function main() {
  const config = loadConfig();

  console.log(`Staging URL: ${config.url}`);
  console.log(`Test user:   ${config.email}`);

  const client = createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log('Signing in...');
  const { error: signInErr } = await client.auth.signInWithPassword({
    email: config.email,
    password: config.password,
  });
  if (signInErr) {
    console.error(`Auth failed: ${signInErr.message}`);
    process.exit(1);
  }
  console.log('Signed in.\n');

  // CLI filter
  const filterArg = process.argv.find((a) => a.startsWith('--filter='))?.split('=')[1]
    ?? process.env.EVAL_FILTER;
  const filterIds = filterArg ? new Set(filterArg.split(',').map((s) => s.trim())) : null;
  const cases = filterIds
    ? EVAL_SET_V2.filter((c) => filterIds.has(c.id))
    : EVAL_SET_V2;

  console.log(`Running ${cases.length} case(s)...\n`);

  const results: ResultRow[] = [];
  for (let i = 0; i < cases.length; i++) {
    const c = cases[i];
    process.stdout.write(`  [${i + 1}/${cases.length}] ${c.id} ... `);
    const row = await runCase(client, c, config.timeoutMs);
    results.push(row);
    const status = row.error ? `ERROR: ${row.error}` : (row.pass ? 'PASS' : 'FAIL');
    process.stdout.write(`${status} (${row.latency_ms}ms)\n`);

    if (i < cases.length - 1 && config.delayMs > 0) {
      await new Promise((res) => setTimeout(res, config.delayMs));
    }
  }

  // Write results JSON
  const outPath = 'scripts/spike/v1-results.json';
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\nWrote ${outPath} (${results.length} rows)`);

  printSummary(results);
}

main().catch((err) => {
  console.error('\nFATAL:', err);
  process.exit(1);
});