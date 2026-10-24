/**
 * AI baseline harness for Phase 6.0.
 *
 * Calls the existing production `parse-meal` edge function for every meal in
 * the eval set and records what the current AI-only pipeline returns.
 *
 * READ-ONLY against production. It only writes to a local JSON file. It does
 * not modify parse-meal, the client, the DB, or any rate limit.
 *
 * Respects daily AI limits via `reserve_api_usage` — the same path real users
 * hit. If the account hits its limit mid-run, the harness stops and records
 * the remaining meals as `skipped_limit`.
 *
 * Requires three env vars (see scripts/spike/REPORT.md for setup):
 *   VITE_SUPABASE_URL       — already in .env
 *   VITE_SUPABASE_ANON_KEY  — already in .env
 *   SPIKE_TEST_EMAIL        — a real Supabase Auth user (NOT anonymous)
 *   SPIKE_TEST_PASSWORD     — that user's password
 */

import 'dotenv/config';
import { config as loadEnv } from 'dotenv';
import { writeFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { EVAL_SET, type EvalMeal } from '../../spike/eval-set';
import { findFood } from '../../spike/data/foods';
import { identifyCanonicalId } from '../../spike/resolver';

// Load .env.local first (wins over .env), then fall back to .env.
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

interface AiBaselineRow {
  id: string;
  text: string;
  expected_kcal: number;
  expected_protein: number;
  ai_kcal: number | null;
  ai_protein: number | null;
  ai_carbs: number | null;
  ai_fat: number | null;
  ai_confidence: number | null;
  ai_foods_detected: string[];
  ai_canonical_ids: (string | null)[];
  food_match: boolean | null;      // null when no ground truth (ambiguous meals)
  kcal_err_pct: number | null;
  protein_err_g: number | null;
  latency_ms: number;
  source: string;                  // kb | memory_cache | db_cache | llm | error | skipped_limit
  cost_usd: number;
  error: string | null;
}

const AI_CALL_COST_USD = 0.0001;  // conservative ceiling; Groq is ~half this

function expectedTotals(meal: EvalMeal) {
  let kcal = 0, protein = 0;
  for (const item of meal.expected_items) {
    const f = findFood(item.canonical);
    if (!f) throw new Error(`Eval references unknown food: ${item.canonical}`);
    const scale = item.grams / 100;
    kcal += f.per_100g.kcal * scale;
    protein += f.per_100g.protein * scale;
  }
  return { kcal: Math.round(kcal), protein: Math.round(protein * 10) / 10 };
}

function foodMatch(expected: string[], detectedIds: (string | null)[]): boolean | null {
  if (expected.length === 0) return null; // ambiguous meal — no ground truth
  const exp = [...expected].sort();
  const act = detectedIds.filter(Boolean).sort() as string[];
  if (exp.length !== act.length) return false;
  return exp.every((e, i) => e === act[i]);
}

function mape(values: number[]): number {
  if (!values.length) return 0;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
}

function mae(values: number[]): number {
  if (!values.length) return 0;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

async function main() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  const email = process.env.SPIKE_TEST_EMAIL;
  const password = process.env.SPIKE_TEST_PASSWORD;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const missing: string[] = [];
  if (!url) missing.push('VITE_SUPABASE_URL');
  if (!key) missing.push('VITE_SUPABASE_ANON_KEY');
  if (!email) missing.push('SPIKE_TEST_EMAIL');
  if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');

  if (missing.length) {
    console.error('\nMissing env vars: ' + missing.join(', '));
    console.error('\nSetup:');
    console.error('  1. Add SPIKE_TEST_EMAIL + SUPABASE_SERVICE_ROLE_KEY to .env.local');
    console.error('  2. Create the user in Supabase Dashboard → Authentication → Users');
    console.error('  3. Temporarily upgrade the user to Premium (see scripts/spike/REPORT.md)');
    console.error('  4. Re-run this script\n');
    process.exit(1);
  }

  // Sign-in via admin-generated magic link. Bypasses CAPTCHA because the
  // OTP is minted server-side with the service_role key. The session we
  // get back is a REAL user session — all subsequent parse-meal calls go
  // through normal auth + plan + rate limiting.
  console.log(`\nMinting session for ${email}...`);
  const admin = createClient(url!, serviceRoleKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: email!,
  });

  if (linkErr || !linkData?.properties?.hashed_token) {
    console.error(
      'Magic-link generation failed: ' +
        (linkErr?.message ?? 'no hashed_token returned'),
    );
    process.exit(1);
  }

  const supabase = createClient(url!, key!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: sessionData, error: verifyErr } = await supabase.auth.verifyOtp({
    type: 'magiclink',
    token_hash: linkData.properties.hashed_token,
  });

  if (verifyErr || !sessionData?.session) {
    console.error(
      'OTP verification failed: ' + (verifyErr?.message ?? 'no session returned'),
    );
    process.exit(1);
  }

  console.log(`Signed in. User id: ${sessionData.session.user.id}`);
  console.log(`Running ${EVAL_SET.length} meals against parse-meal...\n`);

  const rows: AiBaselineRow[] = [];
  let limitHit = false;

  for (const meal of EVAL_SET) {
    if (limitHit) {
      rows.push({
        id: meal.id, text: meal.text,
        expected_kcal: 0, expected_protein: 0,
        ai_kcal: null, ai_protein: null, ai_carbs: null, ai_fat: null,
        ai_confidence: null, ai_foods_detected: [], ai_canonical_ids: [],
        food_match: null, kcal_err_pct: null, protein_err_g: null,
        latency_ms: 0, source: 'skipped_limit', cost_usd: 0,
        error: 'Daily AI limit reached before this meal ran',
      });
      continue;
    }

    const t0 = performance.now();
    const { data, error } = await supabase.functions.invoke('parse-meal', {
      body: {
        text: meal.text,
        remainingCalories: 600,
        remainingProtein: 40,
        mealType: 'lunch',
        userGoal: 'cut',
        dietaryPreference: 'unspecified',
      },
    });
    const t1 = performance.now();
    const latency_ms = Math.round(t1 - t0);

    // Handle limit-reached 429 — no more calls, mark the rest and stop.
    if (error) {
      const errMsg = (error as { message?: string }).message ?? String(error);
      // Try to read the JSON body from FunctionsHttpError.context
      let bodyErr: Record<string, unknown> | null = null;
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.json === 'function') {
        try { bodyErr = await ctx.json(); } catch { /* ignore */ }
      }

      const code = bodyErr?.error_code as string | undefined;
      if (code === 'daily_limit' || errMsg.includes('Daily AI limit')) {
        limitHit = true;
        console.log(`[${meal.id}] 429 daily limit reached — stopping.`);
      }

      const exp = expectedTotals(meal);
      rows.push({
        id: meal.id, text: meal.text,
        expected_kcal: exp.kcal, expected_protein: exp.protein,
        ai_kcal: null, ai_protein: null, ai_carbs: null, ai_fat: null,
        ai_confidence: null, ai_foods_detected: [], ai_canonical_ids: [],
        food_match: null, kcal_err_pct: null, protein_err_g: null,
        latency_ms, source: 'error', cost_usd: 0,
        error: (bodyErr?.error as string) ?? errMsg,
      });
      continue;
    }

    if (!data || typeof data.calories !== 'number') {
      const exp = expectedTotals(meal);
      rows.push({
        id: meal.id, text: meal.text,
        expected_kcal: exp.kcal, expected_protein: exp.protein,
        ai_kcal: null, ai_protein: null, ai_carbs: null, ai_fat: null,
        ai_confidence: null, ai_foods_detected: [], ai_canonical_ids: [],
        food_match: null, kcal_err_pct: null, protein_err_g: null,
        latency_ms, source: 'error', cost_usd: 0,
        error: 'Invalid response — no calories field',
      });
      continue;
    }

    // Canonicalize the LLM's free-form foods_detected for a rough food-match.
    const detected: string[] = Array.isArray(data.foods_detected) ? data.foods_detected : [];
    const canonicalIds = detected.map((d) => identifyCanonicalId(d));

    const exp = expectedTotals(meal);
    const match = foodMatch(meal.expected_items.map((e) => e.canonical), canonicalIds);
    const kcal_err_pct = exp.kcal > 0
      ? Math.round((Math.abs(data.calories - exp.kcal) / exp.kcal) * 1000) / 10
      : null;
    const protein_err_g = exp.protein > 0
      ? Math.round(Math.abs(data.protein - exp.protein) * 10) / 10
      : null;

    const source = (data.source as string) ?? 'unknown';
    const cost = source === 'llm' ? AI_CALL_COST_USD : 0;

    rows.push({
      id: meal.id, text: meal.text,
      expected_kcal: exp.kcal, expected_protein: exp.protein,
      ai_kcal: data.calories, ai_protein: data.protein,
      ai_carbs: data.carbs, ai_fat: data.fat,
      ai_confidence: data.confidence,
      ai_foods_detected: detected,
      ai_canonical_ids: canonicalIds,
      food_match: match,
      kcal_err_pct, protein_err_g,
      latency_ms, source, cost_usd: cost, error: null,
    });

    // Be polite to the edge function.
    await new Promise((r) => setTimeout(r, 300));
  }

  // ---- Aggregate ----
  const definite = rows.filter((r) => r.expected_kcal > 0 && r.ai_kcal !== null);
  const matchable = definite.filter((r) => r.food_match !== null);

  const matchAcc = matchable.length
    ? Math.round((matchable.filter((r) => r.food_match).length / matchable.length) * 1000) / 10
    : 0;
  const kcalMape = mape(definite.map((r) => r.kcal_err_pct!).filter((v) => v !== null));
  const kcalMae = mae(definite.map((r) => Math.abs((r.ai_kcal ?? 0) - r.expected_kcal)));
  const proteinMae = mae(definite.map((r) => r.protein_err_g!).filter((v) => v !== null));
  const avgLatency = rows.length
    ? Math.round(rows.reduce((s, r) => s + r.latency_ms, 0) / rows.length)
    : 0;
  const totalCost = rows.reduce((s, r) => s + r.cost_usd, 0);
  const llmHits = rows.filter((r) => r.source === 'llm').length;
  const cacheHits = rows.filter((r) => r.source.endsWith('_cache')).length;
  const kbHits = rows.filter((r) => r.source === 'kb').length;
  const errorCount = rows.filter((r) => r.source === 'error' || r.source === 'skipped_limit').length;

  console.log('\n=== LeanIQA Phase 6.0 — AI Baseline (parse-meal) ===\n');
  console.log(`Meals attempted:         ${rows.length}`);
  console.log(`Definite results:        ${definite.length}`);
  console.log(`Food-match accuracy:     ${matchAcc}%`);
  console.log(`Calorie MAPE:            ${kcalMape}%`);
  console.log(`Calorie MAE:             ${kcalMae} kcal`);
  console.log(`Protein MAE:             ${proteinMae} g`);
  console.log(`Average latency:         ${avgLatency} ms`);
  console.log(`Total estimated cost:    $${totalCost.toFixed(4)}`);
  console.log(`  KB hits:               ${kbHits}`);
  console.log(`  Cache hits:            ${cacheHits}`);
  console.log(`  LLM calls:             ${llmHits}`);
  console.log(`  Errors / skipped:      ${errorCount}\n`);

  console.log('Per-meal detail:');
  console.log('id   | text                                         | exp kCal | ai kCal | err%  | exp P | ai P | P err | match | source        | lat ms | cost $');
  console.log('-----|----------------------------------------------|----------|---------|-------|-------|------|-------|-------|---------------|--------|-------');
  const pad = (s: string, n: number) => (s + ' '.repeat(n)).slice(0, n);
  for (const r of rows) {
    console.log(
      pad(r.id, 4) + ' | ' +
      pad(r.text, 44) + ' | ' +
      pad(String(r.expected_kcal), 8) + ' | ' +
      pad(String(r.ai_kcal ?? '—'), 7) + ' | ' +
      pad(r.kcal_err_pct != null ? r.kcal_err_pct.toFixed(1) : '—', 5) + ' | ' +
      pad(String(r.expected_protein), 5) + ' | ' +
      pad(String(r.ai_protein ?? '—'), 4) + ' | ' +
      pad(r.protein_err_g != null ? r.protein_err_g.toFixed(1) : '—', 5) + ' | ' +
      pad(r.food_match === null ? '—' : (r.food_match ? 'yes' : 'NO'), 5) + ' | ' +
      pad(r.source, 13) + ' | ' +
      pad(String(r.latency_ms), 6) + ' | ' +
      '$' + r.cost_usd.toFixed(5)
    );
  }

  writeFileSync('scripts/spike/ai-baseline-results.json', JSON.stringify(rows, null, 2));
  console.log('\nWrote scripts/spike/ai-baseline-results.json\n');
  process.exit(0);
}


main().catch((err) => {
  console.error('Baseline harness crashed:', err);
  process.exit(1);
});