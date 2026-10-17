import { resolve } from './resolver';
import { EVAL_SET, type EvalMeal } from './eval-set';
import { findFood } from './data/foods';
import { writeFileSync } from 'fs';

interface Metrics {
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
  requires_confirmation_any: boolean;   // NEW
  resolution_types: string[];           // NEW — distinct list of item resolution types
  resolution_ms: number;
  note?: string;
}

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

function canonicalSet(ids: (string | null)[]): string {
  return ids.filter(Boolean).sort().join(',');
}

function foodMatch(meal: EvalMeal, resolvedIds: (string | null)[]): boolean {
  if (meal.expected_items.length === 0) return true; // ambiguous: no expectation
  const expected = meal.expected_items.map((e) => e.canonical).sort();
  const actual = resolvedIds.filter(Boolean).sort() as string[];
  if (expected.length !== actual.length) return false;
  return expected.every((e, i) => e === actual[i]);
}

function mape(values: number[]): number {
  if (!values.length) return 0;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
}

function main() {
  const rows: Metrics[] = [];

  for (const meal of EVAL_SET) {
    const t0 = performance.now();
    const result = resolve(meal.text);
    const t1 = performance.now();

    const exp = expectedTotals(meal);
    const resolvedIds = result.items.map((i) => i.food_id);

    const kcal_err_pct = exp.kcal > 0
      ? Math.abs(result.total_kcal - exp.kcal) / exp.kcal * 100
      : 0;

    rows.push({
      id: meal.id,
      text: meal.text,
      expected_kcal: exp.kcal,
      actual_kcal: result.total_kcal,
      kcal_err_pct: Math.round(kcal_err_pct * 10) / 10,
      expected_protein: exp.protein,
      actual_protein: result.total_protein,
      protein_err_g: Math.round(Math.abs(result.total_protein - exp.protein) * 10) / 10,
      food_match: foodMatch(meal, resolvedIds),
      layers_used: result.layers_used.join('|'),
      overall_confidence: result.overall_confidence,
      needs_confirmation: result.needs_confirmation,
      resolution_ms: Math.round(t1 - t0),
      note: meal.note,
            requires_confirmation_any: result.items.some((i) => i.requires_confirmation),
      resolution_types: Array.from(new Set(result.items.map((i) => i.resolution_type))),
    });
  }

  // ---------- Aggregate ----------
  const definite = rows.filter((r) => r.expected_kcal > 0);
  const ambiguous = rows.filter((r) => r.expected_kcal === 0);

  const matchAccuracy = definite.length
    ? Math.round((definite.filter((r) => r.food_match).length / definite.length) * 1000) / 10
    : 0;
  const kcalMape = mape(definite.map((r) => r.kcal_err_pct));
  const proteinMae = definite.length
    ? Math.round((definite.reduce((s, r) => s + r.protein_err_g, 0) / definite.length) * 10) / 10
    : 0;
  const aiFallbackRate = definite.length
    ? Math.round((definite.filter((r) => r.layers_used.includes('unknown')).length / definite.length) * 1000) / 10
    : 0;
  const ambiguityCorrectlyFlagged = ambiguous.length
    ? ambiguous.filter((r) => r.needs_confirmation).length
    : 0;
  const avgMs = Math.round(rows.reduce((s, r) => s + r.resolution_ms, 0) / rows.length);

  // ---------- Print ----------
  console.log('\n=== LeanIQA Phase 6.0 Spike — Results ===\n');
  console.log(`Meals tested:               ${rows.length} (${definite.length} definite, ${ambiguous.length} ambiguous)`);
  console.log(`Food-match accuracy:        ${matchAccuracy}%   (target ≥ 70%)`);
  console.log(`Calorie MAPE:               ${kcalMape}%   (target < 20%)`);
  console.log(`Protein MAE:                ${proteinMae} g   (target < 15 g)`);
  console.log(`AI-fallback rate:           ${aiFallbackRate}%   (target < 70%)`);
  console.log(`Ambiguity correctly flagged: ${ambiguityCorrectlyFlagged}/${ambiguous.length}`);
  console.log(`Average resolution time:    ${avgMs} ms\n`);

  console.log('Per-meal detail:');
    console.log('id   | text                                         | exp kcal | act kcal | err%  | exp P | act P | P err | match | layer         | conf | needs? | resolution');
  console.log('-----|----------------------------------------------|----------|----------|-------|-------|-------|-------|-------|---------------|------|-------');
  for (const r of rows) {
    const pad = (s: string, n: number) => (s + ' '.repeat(n)).slice(0, n);
    console.log(
      pad(r.id, 4) + ' | ' +
      pad(r.text, 44) + ' | ' +
      pad(String(r.expected_kcal), 8) + ' | ' +
      pad(String(r.actual_kcal), 8) + ' | ' +
      pad(String(r.kcal_err_pct), 5) + ' | ' +
      pad(String(r.expected_protein), 5) + ' | ' +
      pad(String(r.actual_protein), 5) + ' | ' +
      pad(String(r.protein_err_g), 5) + ' | ' +
      pad(r.food_match ? 'yes' : 'NO', 5) + ' | ' +
      pad(r.layers_used, 13) + ' | ' +
            pad(String(r.overall_confidence), 4) + ' | ' +
      (r.needs_confirmation ? 'YES' : 'no ') + ' | ' +
      pad(r.resolution_types.join('+'), 14)
    );
  }

  // ---------- Failing meal types ----------
  const failing = definite.filter((r) => !r.food_match || r.kcal_err_pct > 20);
  console.log('\nTop failing meals (miss or >20% kcal error):');
  if (failing.length === 0) {
    console.log('  (none — all definite meals within tolerance)');
  } else {
    for (const r of failing) console.log(`  ${r.id}  ${r.text}   (err ${r.kcal_err_pct}%, match=${r.food_match})`);
  }

  // ---------- Verdict ----------
  const passes = matchAccuracy >= 70 && kcalMape < 20 && proteinMae < 15 && aiFallbackRate < 70;
  console.log('\nVERDICT: ' + (passes ? '✅ PASS — proceed to full Phase 6' : '⚠️  PARTIAL — review failing meals before committing'));
  console.log('');
    // Persist for compare.ts
  writeFileSync(
    'scripts/spike/hybrid-results.json',
    JSON.stringify(rows, null, 2),
  );
  console.log('Wrote scripts/spike/hybrid-results.json');
}

main();