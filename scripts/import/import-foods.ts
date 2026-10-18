/**
 * Import the food catalog into the staging database.
 *
 * Sources:
 *   - Curated Indian cooked dishes (scripts/import/data/curated-indian-dishes.ts)
 *   - USDA Foundation Foods (--source-dir pointing at the extracted folder)
 *   - USDA SR Legacy       (--source-dir pointing at the extracted folder)
 *
 * SAFETY:
 *   Refuses to run unless:
 *     1. STAGING_SUPABASE_URL and STAGING_SUPABASE_SERVICE_ROLE_KEY are set
 *     2. EXPECTED_STAGING_REF matches the URL's project ref
 *     3. .supabase/.temp/project-ref, if present, also matches
 *
 *   Never targets production. There is no override.
 *
 * Idempotent: uses ON CONFLICT (source, source_id) DO UPDATE.
 *
 * Usage:
 *   npx tsx scripts/import/import-foods.ts --curated-only
 *   npx tsx scripts/import/import-foods.ts --usda-only --source-dir "C:\\path\\to\\foundation"
 *   npx tsx scripts/import/import-foods.ts --usda-only --source-dir "C:\\path\\to\\sr_legacy"
 *   npx tsx scripts/import/import-foods.ts --usda-only
 *   npx tsx scripts/import/import-foods.ts
 *   # add --dry-run to any of the above
 *
 * Exit codes: 0 success, 1 any failure.
 */

import 'dotenv/config';
import { config as loadEnv } from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';
import { createClient } from '@supabase/supabase-js';
import { CURATED_INDIAN_DISHES, type CuratedDish } from './data/curated-indian-dishes';
import { assertStagingTarget, assertProductionTarget } from './_validate-target';

loadEnv({ path: '.env' });
loadEnv({ path: '.env.local', override: true });

const DEFAULT_USDA_DIR = resolve(process.cwd(), 'scripts/import/data/usda');

const NUTRIENT_ID = {
  KCAL: 1008,
  PROTEIN: 1003,
  FAT: 1004,
  CARBS: 1005,
  FIBER: 1079,
} as const;

const SOURCE_RANK: Record<string, number> = {
  curated: 0,
  ifct: 1,
  usda_foundation: 2,
  usda_sr_legacy: 3,
  usda_fndds: 4,
};

const ALLOWED_PROVENANCE = new Set([
  'lab_measured',
  'recipe_calculated',
  'published_reference',
  'undocumented',
  'usda_foundation',
  'usda_sr_legacy',
]);

const REQUIRED_HEADERS = {
  'food.csv': ['fdc_id', 'data_type', 'description'],
  'food_nutrient.csv': ['fdc_id', 'nutrient_id', 'amount'],
} as const;

interface FoodRow {
  source: string;
  source_id: string;
  source_rank: number;
  canonical_name: string;
  display_name: string;
  search_name: string;
  category: string | null;
  kcal_per_100g: number;
  protein_per_100g: number;
  fat_per_100g: number;
  carbs_per_100g: number;
  fiber_per_100g: number;
  default_portion_grams: number | null;
  default_portion_label: string | null;
  provenance: string | null;
  review_status: string;
  oil_included: boolean;
  oil_per_100g: number | null;
}

// JavaScript word boundaries. \m and \M are PostgreSQL-only; JS treats them
// as literal characters, so a pre-normalization label would slip past the
// check silently.
const FORBIDDEN_LABEL_TOKENS =
  /\b(bowls|katoris|katori|glasses|cups|pieces|slices|scoops|grams|gms)\b/i;

function normalizeCanonical(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildSearchName(canonical: string, aliases: string[], category: string | null): string {
  const parts = [canonical, ...aliases.map((a) => a.toLowerCase())];
  if (category) parts.push(category);
  return Array.from(new Set(parts.map((p) => p.trim()).filter(Boolean))).join(' ');
}

function curatedToFoodRow(dish: CuratedDish): FoodRow {
  return {
    source: 'curated',
    source_id: dish.source_id,
    source_rank: SOURCE_RANK.curated,
    canonical_name: dish.canonical_name,
    display_name: dish.display_name,
    search_name: buildSearchName(dish.canonical_name, dish.aliases, dish.category),
    category: dish.category,
    kcal_per_100g: dish.kcal_per_100g,
    protein_per_100g: dish.protein_per_100g,
    fat_per_100g: dish.fat_per_100g,
    carbs_per_100g: dish.carbs_per_100g,
    fiber_per_100g: dish.fiber_per_100g,
    default_portion_grams: dish.default_portion_grams,
    default_portion_label: dish.default_portion_label,
    provenance: dish.provenance,
    review_status: dish.review_status,
    oil_included: dish.oil_included,
    oil_per_100g: dish.oil_per_100g,
  };
}

// ---------- CSV parsing ----------

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i += 1; continue;
      }
      field += c; i += 1; continue;
    }
    if (c === '"') { inQuotes = true; i += 1; continue; }
    if (c === ',') { row.push(field); field = ''; i += 1; continue; }
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i += 1; continue; }
    if (c === '\r') { i += 1; continue; }
    field += c; i += 1;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function rowsToObjects(rows: string[][]): Record<string, string>[] {
  if (!rows.length) return [];
  const header = rows[0];
  const out: Record<string, string>[] = [];
  for (let i = 1; i < rows.length; i += 1) {
    const r = rows[i];
    const obj: Record<string, string> = {};
    for (let j = 0; j < header.length; j += 1) obj[header[j]] = r[j] ?? '';
    out.push(obj);
  }
  return out;
}

/**
 * Read a CSV file as text with any UTF-8 BOM stripped.
 *
 * Why this exists: `Set-Content` on Windows writes UTF-8 with a BOM by
 * default. If the BOM survives into the parser, the first header field
 * name becomes `\uFEFFfdc_id` and every row's `obj['fdc_id']` is undefined.
 * Every caller that reads a CSV must go through this helper.
 */
function readCsvText(filePath: string): string {
  const raw = readFileSync(filePath, 'utf8');
  return raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw;
}

// ---------- Header validation ----------

function validateCsvHeaders(filePath: string, requiredCols: readonly string[]): void {
  if (!existsSync(filePath)) {
    throw new Error(`Missing required file: ${filePath}`);
  }
  const text = readCsvText(filePath);
  const firstLine = text.split(/\r?\n/, 1)[0];
  if (!firstLine) {
    throw new Error(`File is empty: ${filePath}`);
  }
  const headers = parseCsv(firstLine)[0]?.map((h) => h.trim()) ?? [];
  const missing = requiredCols.filter((c) => !headers.includes(c));
  if (missing.length) {
    throw new Error(
      `Header mismatch in ${filePath}\n` +
      `  Required columns: ${requiredCols.join(', ')}\n` +
      `  Found columns:    ${headers.slice(0, 8).join(', ')}${headers.length > 8 ? ', …' : ''}\n` +
      `  Missing:          ${missing.join(', ')}\n` +
      `\n` +
      `  If you passed a --source-dir, check that it contains:\n` +
      `    food.csv (fdc_id, data_type, description)\n` +
      `    food_nutrient.csv (fdc_id, nutrient_id, amount)`,
    );
  }
}

// ---------- USDA parsing ----------

function loadUsdaFoods(sourceDir: string): FoodRow[] {
  const foodPath = join(sourceDir, 'food.csv');
  const nutrientPath = join(sourceDir, 'food_nutrient.csv');

  validateCsvHeaders(foodPath, REQUIRED_HEADERS['food.csv']);
  validateCsvHeaders(nutrientPath, REQUIRED_HEADERS['food_nutrient.csv']);

  console.log(`[USDA] Parsing ${foodPath}`);
  const foodRows = rowsToObjects(parseCsv(readCsvText(foodPath)));
  console.log(`[USDA] ${foodRows.length} food rows`);

  console.log(`[USDA] Parsing ${nutrientPath}`);
  const nutrientRows = rowsToObjects(parseCsv(readCsvText(nutrientPath)));
  console.log(`[USDA] ${nutrientRows.length} food_nutrient rows`);

  const nutrientMap = new Map<string, Map<number, number>>();
  const wanted = new Set<number>(Object.values(NUTRIENT_ID));
  for (const r of nutrientRows) {
    const nid = Number(r.nutrient_id);
    if (!wanted.has(nid)) continue;
    const amount = Number(r.amount);
    if (!Number.isFinite(amount)) continue;
    let inner = nutrientMap.get(r.fdc_id);
    if (!inner) { inner = new Map(); nutrientMap.set(r.fdc_id, inner); }
    inner.set(nid, amount);
  }

  const wantedTypes = new Set(['foundation_food', 'sr_legacy_food']);
  const out: FoodRow[] = [];
  let skippedOtherType = 0;
  let skippedMissingMacros = 0;

  for (const f of foodRows) {
    if (!wantedTypes.has(f.data_type)) { skippedOtherType += 1; continue; }
    const n = nutrientMap.get(f.fdc_id);
    if (!n) { skippedMissingMacros += 1; continue; }
    const kcal = n.get(NUTRIENT_ID.KCAL);
    const protein = n.get(NUTRIENT_ID.PROTEIN);
    const fat = n.get(NUTRIENT_ID.FAT);
    const carbs = n.get(NUTRIENT_ID.CARBS);
    const fiber = n.get(NUTRIENT_ID.FIBER) ?? 0;
    if (kcal == null || protein == null || fat == null || carbs == null) {
      skippedMissingMacros += 1;
      continue;
    }
    const description = (f.description ?? '').trim();
    if (!description) { skippedMissingMacros += 1; continue; }
    const canonical = normalizeCanonical(description);
    if (!canonical) { skippedMissingMacros += 1; continue; }

    // `source` doubles as the provenance value: 'usda_foundation' or
    // 'usda_sr_legacy'. This distinguishes a lab-derived Foundation row
    // from a legacy reference row at the provenance level, which matters
    // for the resolver's source_rank tie-break and for any future
    // accuracy audit.
    const source = f.data_type === 'foundation_food' ? 'usda_foundation' : 'usda_sr_legacy';
    out.push({
      source,
      source_id: f.fdc_id,
      source_rank: SOURCE_RANK[source],
      canonical_name: canonical,
      display_name: description,
      search_name: buildSearchName(canonical, [], null),
      category: null,
      kcal_per_100g: Math.round(kcal * 100) / 100,
      protein_per_100g: Math.round(protein * 100) / 100,
      fat_per_100g: Math.round(fat * 100) / 100,
      carbs_per_100g: Math.round(carbs * 100) / 100,
      fiber_per_100g: Math.round(fiber * 100) / 100,
      default_portion_grams: null,
      default_portion_label: null,
      provenance: source,
      review_status: 'provisional',
      oil_included: false,
      oil_per_100g: null,
    });
  }

  console.log(`[USDA] ${out.length} usable rows`);
  console.log(`[USDA]   skipped ${skippedOtherType} rows with other data_types`);
  console.log(`[USDA]   skipped ${skippedMissingMacros} rows missing required macros`);
  return out;
}

// ---------- Validation ----------

interface ValidationError {
  row: string;
  field: string;
  message: string;
}

function validateRows(rows: FoodRow[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const seenKeys = new Set<string>();

  for (const r of rows) {
    const id = `${r.source}:${r.source_id}`;

    if (seenKeys.has(id)) {
      errors.push({ row: id, field: 'source_id', message: 'duplicate in input' });
      continue;
    }
    seenKeys.add(id);

    if (!r.canonical_name) {
      errors.push({ row: id, field: 'canonical_name', message: 'empty' });
    }
    if (r.kcal_per_100g < 0 || r.kcal_per_100g > 2000) {
      errors.push({ row: id, field: 'kcal_per_100g', message: `out of range: ${r.kcal_per_100g}` });
    }
    if (r.protein_per_100g < 0 || r.protein_per_100g > 100) {
      errors.push({ row: id, field: 'protein_per_100g', message: `out of range: ${r.protein_per_100g}` });
    }
    if (r.fat_per_100g < 0 || r.fat_per_100g > 100) {
      errors.push({ row: id, field: 'fat_per_100g', message: `out of range: ${r.fat_per_100g}` });
    }
    if (r.carbs_per_100g < 0 || r.carbs_per_100g > 100) {
      errors.push({ row: id, field: 'carbs_per_100g', message: `out of range: ${r.carbs_per_100g}` });
    }
    if (r.default_portion_label && FORBIDDEN_LABEL_TOKENS.test(r.default_portion_label)) {
      errors.push({
        row: id, field: 'default_portion_label',
        message: `pre-normalization token in "${r.default_portion_label}"`,
      });
    }
    if (!['verified', 'provisional', 'rejected'].includes(r.review_status)) {
      errors.push({ row: id, field: 'review_status', message: `invalid: ${r.review_status}` });
    }
    if (r.provenance !== null && !ALLOWED_PROVENANCE.has(r.provenance)) {
      errors.push({
        row: id, field: 'provenance',
        message: `not in allowed set: ${r.provenance}`,
      });
    }
  }
  return errors;
}

// ---------- Upsert ----------

async function upsertInBatches(
  supabase: ReturnType<typeof createClient>,
  rows: FoodRow[],
  dryRun: boolean,
): Promise<{ inserted: number; failed: number }> {
  const BATCH = 500;
  let inserted = 0;
  let failed = 0;

  if (dryRun) {
    return { inserted: rows.length, failed: 0 };
  }

  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error } = await supabase
      .from('foods')
      .upsert(chunk, { onConflict: 'source,source_id' });
    if (error) {
      console.error(`\n[upsert] batch ${i}-${i + chunk.length} failed: ${error.message}`);
      failed += chunk.length;
    } else {
      inserted += chunk.length;
      process.stdout.write(`\r[upsert] ${inserted}/${rows.length}`);
    }
  }
  process.stdout.write('\n');
  return { inserted, failed };
}

async function countBySource(
  supabase: ReturnType<typeof createClient>,
): Promise<Record<string, number>> {
  const { data, error } = await supabase.from('foods').select('source');
  if (error || !data) return {};
  const out: Record<string, number> = {};
  for (const row of data) out[row.source] = (out[row.source] ?? 0) + 1;
  return out;
}

// ---------- CLI ----------

interface ParsedArgs {
  dryRun: boolean;
  usdaOnly: boolean;
  curatedOnly: boolean;
  sourceDir: string | null;
}

function parseArgs(argv: string[]): ParsedArgs {
  let dryRun = false;
  let usdaOnly = false;
  let curatedOnly = false;
  let sourceDir: string | null = null;

  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    if (arg === '--dry-run') { dryRun = true; i += 1; continue; }
    if (arg === '--usda-only') { usdaOnly = true; i += 1; continue; }
    if (arg === '--curated-only') { curatedOnly = true; i += 1; continue; }
    if (arg === '--source-dir') {
      const next = argv[i + 1];
      if (!next) throw new Error('--source-dir requires a path argument');
      sourceDir = resolve(next);
      i += 2;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (usdaOnly && curatedOnly) {
    throw new Error('--usda-only and --curated-only are mutually exclusive');
  }

  return { dryRun, usdaOnly, curatedOnly, sourceDir };
}

// ---------- Main ----------

async function main(): Promise<void> {
  let args: ParsedArgs;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  // Phase 6.7 R2.9 — dispatch by TARGET_ENV. Default 'staging' preserves
  // existing behavior for any caller that hasn't set TARGET_ENV.
  // Production requires BOTH TARGET_ENV=production AND --confirm-target=production.
  const targetEnv = (process.env.TARGET_ENV ?? 'staging').toLowerCase();
  if (targetEnv !== 'staging' && targetEnv !== 'production') {
    console.error(`TARGET_ENV must be 'staging' or 'production'; got '${targetEnv}'`);
    process.exit(1);
  }
  if (targetEnv === 'production' && process.env.CONFIRM_TARGET !== 'production') {
    console.error(
      'TARGET_ENV=production requires CONFIRM_TARGET=production env var.\n' +
      'This is a safety guard. Refusing to write.',
    );
    process.exit(1);
  }

  const targetUrl = targetEnv === 'staging'
    ? process.env.STAGING_SUPABASE_URL
    : process.env.PROD_SUPABASE_URL;

  let target;
  try {
    target = targetEnv === 'staging'
      ? assertStagingTarget(targetUrl)
      : assertProductionTarget(targetUrl);
  } catch (err) {
    console.error(`Target check failed:\n  ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
  console.log(`Target:   ${target.url}`);
  console.log(`Ref:      ${target.ref}`);
  console.log(`Linked:   ${target.linked ?? '(no linked project file)'}`);
  console.log(`Dry run:  ${args.dryRun ? 'YES' : 'no'}`);
  if (args.sourceDir) console.log(`Source:   ${args.sourceDir}`);
  console.log('');

  const usdaDir = args.sourceDir ?? DEFAULT_USDA_DIR;
  if ((args.usdaOnly || !args.curatedOnly) && !existsSync(usdaDir)) {
    console.warn(`[USDA] Directory not found: ${usdaDir}`);
    console.warn(`[USDA] Continuing without USDA rows.`);
  }

  const curatedRows = args.curatedOnly || !args.usdaOnly
    ? CURATED_INDIAN_DISHES.map(curatedToFoodRow)
    : [];

  let usdaRows: FoodRow[] = [];
  if ((args.usdaOnly || !args.curatedOnly) && existsSync(usdaDir)) {
    try {
      usdaRows = loadUsdaFoods(usdaDir);
    } catch (err) {
      console.error(`\n[USDA] ${err instanceof Error ? err.message : err}`);
      process.exit(1);
    }
  }

  const allRows = [...curatedRows, ...usdaRows];

  const errors = validateRows(allRows);
  if (errors.length) {
    console.error(`Validation failed (${errors.length} errors):`);
    for (const e of errors.slice(0, 50)) {
      console.error(`  ${e.row}  [${e.field}]  ${e.message}`);
    }
    if (errors.length > 50) console.error(`  ... and ${errors.length - 50} more`);
    process.exit(1);
  }

  console.log('');
  console.log(`Rows validated:               ${allRows.length}`);
  console.log(`  Curated:                    ${curatedRows.length}`);
  console.log(`  USDA:                       ${usdaRows.length}`);
  console.log('');

  if (args.dryRun) {
    console.log(`Rows that would be upserted:  ${allRows.length}`);
    console.log(`Rows written:                 0`);
    console.log('');
    console.log('Dry run complete. No writes performed.');
    process.exit(0);
  }

  const supabaseUrl = targetEnv === 'staging'
    ? process.env.STAGING_SUPABASE_URL!
    : process.env.PROD_SUPABASE_URL!;
  const supabaseKey = targetEnv === 'staging'
    ? process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY!
    : process.env.PROD_SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient(
    supabaseUrl,
    supabaseKey,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const before = await countBySource(supabase);
  console.log('Row counts BEFORE:');
  const beforeEntries = Object.entries(before).sort();
  if (beforeEntries.length === 0) {
    console.log('  (empty)');
  } else {
    for (const [k, v] of beforeEntries) console.log(`  ${k}: ${v}`);
  }
  console.log('');

  const { inserted, failed } = await upsertInBatches(supabase, allRows, false);

  const after = await countBySource(supabase);
  console.log('');
  console.log('Row counts AFTER:');
  for (const [k, v] of Object.entries(after).sort()) {
    const delta = v - (before[k] ?? 0);
    console.log(`  ${k}: ${v}  (delta ${delta >= 0 ? '+' : ''}${delta})`);
  }

  console.log('');
  console.log(`Rows validated:               ${allRows.length}`);
  console.log(`Rows written:                 ${inserted}`);
  console.log(`Rows failed:                  ${failed}`);
  console.log('');

  if (failed > 0) {
    console.error('Partial failure — some rows did not write.');
    process.exit(1);
  }
  console.log('Import complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});