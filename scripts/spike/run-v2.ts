// =============================================================================
// Phase 6.7 — R2.5: v2 baseline runner
// =============================================================================
// Runs EVAL_SET_V2 against resolve-meal-v2 (KB-primary, AI disabled).
// Writes per-case results to scripts/spike/v2-results.json and prints a
// summary. Same scoring logic and output shape as run-v1.ts, with per-item
// was_ambiguous / kb_confidence included in the results JSON.
//
// SAFETY:
//   - Calls staging ONLY (yvtoxpsmxlrljpuqvzgv). Never production.
//   - v2 does not call AI, does not consume credits.
//   - Does not modify resolve-meal (v5), parse-meal, or the database.
//
// ENV VARS (from .env.local or shell):
//   VITE_SUPABASE_URL           (fallback: SUPABASE_URL)
//   VITE_SUPABASE_ANON_KEY      (fallback: SUPABASE_ANON_KEY)
//   TEST_USER_EMAIL
//   TEST_USER_PASSWORD
//
// OPTIONAL ENV:
//   EVAL_DELAY_MS     delay between calls (default 300ms)
//   EVAL_TIMEOUT_MS   per-call timeout (default 30000ms)
//   EVAL_FILTER       comma-separated case IDs
//
// MEMORY DISCIPLINE:
//   For baseline comparisons, clear user_meal_memory for the test user
//   before each run. Memory writes during a run mask portion-table gaps
//   on the next run — a case that passes on run N will write a memory
//   entry that resolves the same case on run N+1 without exercising the
//   resolver, hiding whether the underlying data gap was ever closed.
//   Always start a baseline from a clean memory slate:
//     delete from user_meal_memory where user_id = '<test-user-uuid>';
//
// USAGE:
//   npx tsx scripts/spike/run-v2.ts
//   npx tsx scripts/spike/run-v2.ts --filter a04
//   npx tsx scripts/spike/run-v2.ts --filter=a04
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
    console.error('\nAdd them to .env.local and run via:');
    console.error('  npx dotenv-cli -e .env.local -- npx tsx scripts/spike/run-v2.ts');
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

interface ResolvedItemV2 {
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
  /** Phase 6.7 — per-item ambiguity flag. */
  was_ambiguous?: boolean;
  /** Phase 6.7 — confidence in (food × portion). */
  kb_confidence?: number;
}

interface ResolveMealResponseV2 {
  items: ResolvedItemV2[];
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
  /** Phase 6.7 — top-level ambiguity flag. */
  was_ambiguous?: boolean;
  /** Phase 6.7 — min(kb_confidence) across items. */
  kb_confidence?: number;
  /** Phase 6.7 — always false in v2. */
  ai_used?: boolean;
}

interface ItemScore {
  expected: ExpectedItemV2;
  resolved: ResolvedItemV2 | null;
  food_ok: boolean;
  grams_ok: boolean;
  /** Per-item Phase 6.7 extras — null when the item was not resolved. */
  was_ambiguous: boolean | null;
  kb_confidence: number | null;
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
  resolved_items: ResolvedItemV2[];
  totals: { kcal: number; protein: number } | null;
  guidance_message: string | null;
  unresolved_count: number;
  raw_layers_used: string[];
  source: string | null;
  kb_confidence_top: number | null;
}

// ---- Helpers ----------------------------------------------------------------

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

/**
 * Prefer response.was_ambiguous when present (v2 always returns it).
 * Fall back to derivation for older responses without the field.
 */
function resolveWasAmbiguous(r: ResolveMealResponseV2): boolean {
  if (typeof r.was_ambiguous === 'boolean') return r.was_ambiguous;
  if (r.guidance_message) return true;
  if (r.needs_confirmation) return true;
  return r.items.some(
    (i) => i.layer === 'ambiguous' || (i.candidates?.length ?? 0) >= 2,
  );
}

function deriveAiUsed(r: ResolveMealResponseV2): boolean {
  if (typeof r.ai_used === 'boolean') return r.ai_used;
  if (r.source === 'hybrid') return true;
  return (r.layers_used ?? []).includes('ai_fallback');
}

/**
 * Parse --filter from argv. Accepts both "--filter X" and "--filter=X".
 * Falls back to EVAL_FILTER env var.
 */
function getFilterArg(): string | undefined {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--filter=')) return a.slice('--filter='.length);
    if (a === '--filter' && i + 1 < args.length) return args[i + 1];
  }
  return process.env.EVAL_FILTER;
}

// ---- Scoring ----------------------------------------------------------------

function matchesExpected(exp: ExpectedItemV2, got: ResolvedItemV2): boolean {
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
  response: ResolveMealResponseV2,
  latency_ms: number,
): CaseScore {
  const used = new Set<number>();
  const itemScores: ItemScore[] = [];

  for (const exp of expected.expected_items) {
    const idx = response.items.findIndex(
      (r, i) => !used.has(i) && matchesExpected(exp, r),
    );
    if (idx === -1) {
      itemScores.push({
        expected: exp,
        resolved: null,
        food_ok: false,
        grams_ok: false,
        was_ambiguous: null,
        kb_confidence: null,
      });
      continue;
    }
    used.add(idx);
    const got = response.items[idx];
    itemScores.push({
      expected: exp,
      resolved: got,
      food_ok: true,
      grams_ok: checkGrams(exp, got.grams),
      was_ambiguous: typeof got.was_ambiguous === 'boolean' ? got.was_ambiguous : null,
      kb_confidence: typeof got.kb_confidence === 'number' ? got.kb_confidence : null,
    });
  }

  const food_match = itemScores.every((s) => s.food_ok);
  const grams_match = itemScores.every((s) => s.grams_ok);
  const unresolved_ok =
    expected.expected_items.length === 0 || response.unresolved_items.length === 0;

  const was_ambiguous_any = resolveWasAmbiguous(response);
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
      client.functions.invoke<ResolveMealResponseV2>('resolve-meal-v2', {
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
      kb_confidence_top: typeof data.kb_confidence === 'number' ? data.kb_confidence : null,
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
        was_ambiguous: null,
        kb_confidence: null,
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
      kb_confidence_top: null,
    };
  }
}

// ---- Summary ----------------------------------------------------------------

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

  console.log('\n========== run-v2 results ==========');
  console.log(`Total cases:       ${total}`);
  console.log(`Passed:            ${passed}/${total} (${pct(passed)})`);
  console.log(`Food match:        ${foodOk}/${total} (${pct(foodOk)})`);
  console.log(`Grams match:       ${gramsOk}/${total} (${pct(gramsOk)})`);
  console.log(`Ambiguity match:   ${ambigOk}/${total} (${pct(ambigOk)})`);
  console.log(`With unresolved:   ${unresolvedRows}/${total} (${pct(unresolvedRows)})`);
  console.log(`AI used:           ${aiRows}/${total} (${pct(aiRows)})  [expect 0 — v2 has no AI fallback]`);
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

  const filterArg = getFilterArg();
  const filterIds = filterArg ? new Set(filterArg.split(',').map((s) => s.trim())) : null;
  const cases = filterIds
    ? EVAL_SET_V2.filter((c) => filterIds.has(c.id))
    : EVAL_SET_V2;

  console.log(`Running ${cases.length} case(s)...\n`);

  const results: ResultRow[] = [];
  for (let i = 0; i < cases.length; i++) {
    const c = cases[i];
    process.stdout.write(`  [${i + 1}/${cases.length}] ${c.id} ... `);
    // Cast: run-v1.ts:408 tsc error is a Supabase v2 client generic mismatch.
    const row = await runCase(client as any, c, config.timeoutMs);
    results.push(row);
    const status = row.error ? `ERROR: ${row.error}` : (row.pass ? 'PASS' : 'FAIL');
    process.stdout.write(`${status} (${row.latency_ms}ms)\n`);

    if (i < cases.length - 1 && config.delayMs > 0) {
      await new Promise((res) => setTimeout(res, config.delayMs));
    }
  }

  const outPath = 'scripts/spike/v2-results.json';
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\nWrote ${outPath} (${results.length} rows)`);

  printSummary(results);
}

main().catch((err) => {
  console.error('\nFATAL:', err);
  process.exit(1);
});