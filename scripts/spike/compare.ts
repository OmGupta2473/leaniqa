/**
 * Side-by-side comparison of the hybrid resolver (this spike) vs. the current
 * AI-only pipeline (parse-meal edge function).
 *
 * Reads:
 *   scripts/spike/hybrid-results.json      — written by run.ts
 *   scripts/spike/ai-baseline-results.json — written by ai-baseline.ts
 *
 * Writes:
 *   scripts/spike/comparison.json
 *
 * Prints a comparison table and a decision recommendation.
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';

interface HybridRow {
  id: string;
  text: string;
  expected_kcal: number;
  actual_kcal: number;
  kcal_err_pct: number;
  expected_protein: number;
  actual_protein: number;
  protein_err_g: number;
  food_match: boolean;
  layers_used: string;
  overall_confidence: number;
  needs_confirmation: boolean;
  requires_confirmation_any: boolean;
  resolution_types: string[];
  resolution_ms: number;
}

interface AiRow {
  id: string;
  text: string;
  expected_kcal: number;
  expected_protein: number;
  ai_kcal: number | null;
  ai_protein: number | null;
  ai_confidence: number | null;
  food_match: boolean | null;
  kcal_err_pct: number | null;
  protein_err_g: number | null;
  latency_ms: number;
  source: string;
  cost_usd: number;
  error: string | null;
}

interface ComparisonRow {
  id: string;
  text: string;
  expected_kcal: number;
  hybrid_kcal: number;
  ai_kcal: number | null;
  hybrid_err_pct: number;
  ai_err_pct: number | null;
  hybrid_protein: number;
  ai_protein: number | null;
  hybrid_protein_err: number;
  ai_protein_err: number | null;
  hybrid_ms: number;
  ai_ms: number;
  hybrid_cost: number;
  ai_cost: number;
  hybrid_conf: number;
  ai_conf: number | null;
  hybrid_needs_conf: boolean;
  ai_source: string;
  winner: 'hybrid' | 'ai' | 'tie' | 'n/a';
}

function loadJson<T>(path: string): T {
  if (!existsSync(path)) {
    console.error(`Missing ${path}. Run the harness that produces it first.`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function avg(xs: number[]): number {
  if (!xs.length) return 0;
  return Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 100) / 100;
}

function mae(xs: number[]): number {
  if (!xs.length) return 0;
  return Math.round((xs.reduce((a, b) => a + Math.abs(b), 0) / xs.length) * 10) / 10;
}

function main() {
  const hybrid = loadJson<HybridRow[]>('scripts/spike/hybrid-results.json');
  const ai = loadJson<AiRow[]>('scripts/spike/ai-baseline-results.json');

  const hybridById = new Map(hybrid.map((r) => [r.id, r]));
  const aiById = new Map(ai.map((r) => [r.id, r]));

  const rows: ComparisonRow[] = [];

  for (const h of hybrid) {
    const a = aiById.get(h.id);
    if (!a) continue;

    const hybridErrPct = h.kcal_err_pct;
    const aiErrPct = a.kcal_err_pct;
    let winner: ComparisonRow['winner'] = 'n/a';
    if (aiErrPct != null && hybridErrPct != null) {
      const delta = Math.abs(hybridErrPct - aiErrPct);
      if (delta < 2) winner = 'tie';
      else if (hybridErrPct < aiErrPct) winner = 'hybrid';
      else winner = 'ai';
    }

    rows.push({
      id: h.id,
      text: h.text,
      expected_kcal: h.expected_kcal,
      hybrid_kcal: h.actual_kcal,
      ai_kcal: a.ai_kcal,
      hybrid_err_pct: hybridErrPct,
      ai_err_pct: aiErrPct,
      hybrid_protein: h.actual_protein,
      ai_protein: a.ai_protein,
      hybrid_protein_err: h.protein_err_g,
      ai_protein_err: a.protein_err_g,
      hybrid_ms: h.resolution_ms,
      ai_ms: a.latency_ms,
      hybrid_cost: 0,   // resolver is local; no per-call cost
      ai_cost: a.cost_usd,
      hybrid_conf: h.overall_confidence,
      ai_conf: a.ai_confidence,
      hybrid_needs_conf: h.needs_confirmation,
      ai_source: a.source,
      winner,
    });
  }

  // ---- Aggregates ----
  const definite = rows.filter((r) => r.expected_kcal > 0 && r.ai_kcal !== null);

  const hybridMape = avg(definite.map((r) => r.hybrid_err_pct));
  const aiMape = avg(definite.map((r) => r.ai_err_pct!).filter((v) => v !== null));

  const hybridMaeKcal = mae(definite.map((r) => r.hybrid_kcal - r.expected_kcal));
  const aiMaeKcal = mae(definite.map((r) => (r.ai_kcal ?? 0) - r.expected_kcal));

  const hybridProteinMae = mae(definite.map((r) => r.hybrid_protein_err));
  const aiProteinMae = mae(definite.map((r) => r.ai_protein_err ?? 0));

  const hybridMatchAcc = (() => {
    const m = definite.filter((r) => {
      const h = hybridById.get(r.id);
      return h && h.expected_kcal > 0;
    });
    if (!m.length) return 0;
    const hits = m.filter((r) => hybridById.get(r.id)!.food_match).length;
    return Math.round((hits / m.length) * 1000) / 10;
  })();

  const aiMatchAcc = (() => {
    const m = definite.filter((r) => r.ai_kcal !== null);
    const withMatch = m.filter((r) => aiById.get(r.id)!.food_match !== null);
    if (!withMatch.length) return 0;
    const hits = withMatch.filter((r) => aiById.get(r.id)!.food_match === true).length;
    return Math.round((hits / withMatch.length) * 1000) / 10;
  })();

  const hybridAvgMs = avg(rows.map((r) => r.hybrid_ms));
  const aiAvgMs = avg(rows.map((r) => r.ai_ms));

  const totalAiCost = rows.reduce((s, r) => s + r.ai_cost, 0);
  const aiCallCount = rows.filter((r) => r.ai_source === 'llm').length;
  const cacheOnlyCost = rows.filter((r) => r.ai_source !== 'llm').reduce((s, r) => s + r.ai_cost, 0);

  const hybridWins = rows.filter((r) => r.winner === 'hybrid').length;
  const aiWins = rows.filter((r) => r.winner === 'ai').length;
  const ties = rows.filter((r) => r.winner === 'tie').length;

  // ---- Print side-by-side ----
  console.log('\n=== LeanIQA Phase 6.0 — Hybrid vs AI Baseline ===\n');
  console.log(`Meals compared:            ${rows.length} (${definite.length} definite)`);
  console.log(`                            Hybrid          AI baseline`);
  console.log(`                            ------          -----------`);
  console.log(`Food-match accuracy         ${pad(String(hybridMatchAcc) + '%', 15)} ${aiMatchAcc}%`);
  console.log(`Calorie MAPE                ${pad(String(hybridMape) + '%', 15)} ${aiMape}%`);
  console.log(`Calorie MAE                 ${pad(String(hybridMaeKcal) + ' kcal', 15)} ${aiMaeKcal} kcal`);
  console.log(`Protein MAE                 ${pad(String(hybridProteinMae) + ' g', 15)} ${aiProteinMae} g`);
  console.log(`Average latency             ${pad(String(hybridAvgMs) + ' ms', 15)} ${aiAvgMs} ms`);
  console.log(`Total cost (34 meals)       ${pad('$0.0000', 15)} $${totalAiCost.toFixed(4)}`);
  console.log(`AI calls required           ${pad('0', 15)} ${aiCallCount}`);
  console.log('');
  console.log(`Per-meal winner:  hybrid ${hybridWins}  |  ai ${aiWins}  |  tie ${ties}`);
  console.log('');

  console.log('Per-meal comparison (kcal only):');
  console.log('id   | text                                         | exp      | hybrid   | err%  | ai       | err%  | winner');
  console.log('-----|----------------------------------------------|----------|----------|-------|----------|-------|--------');
  for (const r of rows) {
    console.log(
      pad(r.id, 4) + ' | ' +
      pad(r.text, 44) + ' | ' +
      pad(String(r.expected_kcal), 8) + ' | ' +
      pad(String(r.hybrid_kcal), 8) + ' | ' +
      pad(r.hybrid_err_pct.toFixed(1), 5) + ' | ' +
      pad(String(r.ai_kcal ?? '—'), 8) + ' | ' +
      pad(r.ai_err_pct != null ? r.ai_err_pct.toFixed(1) : '—', 5) + ' | ' +
      r.winner
    );
  }

  console.log('\nCost extrapolation (assuming all meals hit LLM, i.e. worst case for AI):');
  const costPer1000Ai = (totalAiCost / Math.max(aiCallCount, 1)) * 1000;
  console.log(`  AI baseline, 1000 meals (worst case):  $${costPer1000Ai.toFixed(2)}`);
  console.log(`  AI baseline, 10k MAU × 3 meals/day:    $${(costPer1000Ai * 10000 * 3 * 30 / 1000).toFixed(2)}/month`);
  console.log(`  Hybrid resolver, 1000 meals:           $0.00 (all local)`);
  console.log(`  Hybrid resolver, 10k MAU × 3 meals/day: $0.00/month`);
  console.log('');

  // ---- Recommendation ----
  const hybridBetter = hybridMape < aiMape && hybridProteinMae <= aiProteinMae;
  const hybridTied = Math.abs(hybridMape - aiMape) < 2;

  console.log('=== Recommendation ===\n');
  if (hybridBetter) {
    console.log('✅ PROCEED TO PHASE 6.1.');
    console.log('   Hybrid resolver beats the AI baseline on both calorie MAPE and protein MAE,');
    console.log('   and costs $0 per meal. Phase 6.1\'s structured-output change is justified.');
  } else if (hybridTied) {
    console.log('⚠️  PROCEED TO PHASE 6.1 WITH CAUTION.');
    console.log('   Hybrid and AI baseline are within 2% MAPE. Cost and latency favor hybrid.');
    console.log('   Run a broader eval set (100 meals) before committing to 6.2.');
  } else {
    console.log('⚠️  EXPAND THE EVAL SET FIRST.');
    console.log('   AI baseline is outperforming hybrid on this 34-meal set.');
    console.log('   Grow the eval set to 100 meals and re-check before deciding.');
  }
  console.log('');

  writeFileSync(
    'scripts/spike/comparison.json',
    JSON.stringify({ rows, summary: {
      hybridMape, aiMape, hybridProteinMae, aiProteinMae,
      hybridMatchAcc, aiMatchAcc, hybridAvgMs, aiAvgMs,
      totalAiCost, aiCallCount, hybridWins, aiWins, ties,
    } }, null, 2),
  );
  console.log('Wrote scripts/spike/comparison.json\n');
}

function pad(s: string, n: number): string {
  return (s + ' '.repeat(n)).slice(0, n);
}

main();