/**
 * Build the FDC bundle consumed by parse-meal Layers 2+3.
 *
 * Inputs (already copied into the project):
 *   scripts/import/data/fdc/foundation-foods.json    (USDA Foundation Foods, 2026-10-29)
 *   scripts/import/data/fdc/sr-legacy-foods.json     (USDA SR Legacy, 2018-04)
 *
 * Output:
 *   supabase/functions/_shared/fdc-foods.json        (compact bundle)
 *
 * Both input files use the FDC JSON export shape — foodNutrients is NESTED
 * in both:
 *     { nutrient: { id, number, name, unitName }, amount }
 * Nutrient ids used: 1008 kcal, 1003 protein, 1004 fat, 1005 carbs, 1079 fiber.
 *
 * This is a LOCAL BUILD. It never talks to Supabase and does not import
 * _validate-target.ts.
 *
 * Usage:
 *   npx tsx scripts/import/build-fdc-bundle.ts
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FdcNutrientEntry {
  nutrient?: { id?: number; number?: string; name?: string; unitName?: string };
  amount?: number | string;
}

interface FdcRecord {
  fdcId?: number;
  description?: string;
  dataType?: string;
  foodCategory?: { description?: string };
  foodNutrients?: FdcNutrientEntry[];
}

interface FdcFile {
  FoundationFoods?: FdcRecord[];
  SRLegacyFoods?: FdcRecord[];
}

interface BundleFood {
  id: number;
  desc: string;
  kcal: number;
  p: number;
  f: number;
  c: number;
  fb: number;
  cat: string | null;
  src: "F" | "S";
}

interface AliasEntry {
  /** Normalized Indian/generic name as the user would type it. */
  name: string;
  /** FDC descriptions to try in order; first exact match wins. */
  targets: string[];
  /** true = approximation (conf 0.85 + note emitted at response time). */
  approximate: boolean;
  /** Portion for "1 bowl/cup/piece ..." inputs. Omit → serving-unit falls to AI. */
  portionGrams?: number;
  /** Optional custom approximation note; default note is built at runtime. */
  note?: string;
}

interface AliasRef {
  id: number;
  approx: boolean;
  portion?: number;
  note?: string;
}

interface Bundle {
  foods: BundleFood[];
  aliases: Record<string, AliasRef>;
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");
const FOUNDATION_PATH = resolve(REPO_ROOT, "scripts/import/data/fdc/foundation-foods.json");
const SR_LEGACY_PATH = resolve(REPO_ROOT, "scripts/import/data/fdc/sr-legacy-foods.json");
const OUT_JSON = resolve(REPO_ROOT, "supabase/functions/_shared/fdc-foods.json");

const NUTRIENT_IDS = {
  KCAL: 1008,
  PROTEIN: 1003,
  FAT: 1004,
  CARBS: 1005,
  FIBER: 1079,
} as const;

// ---------------------------------------------------------------------------
// Extractor — nested shape (both files). First entry with matching id wins.
// ---------------------------------------------------------------------------

function extractNutrient(nutrients: FdcNutrientEntry[], id: number): number | null {
  for (const n of nutrients) {
    if (n?.nutrient?.id !== id) continue;
    const raw = n.amount;
    const value = typeof raw === "number" ? raw : Number(raw);
    if (Number.isFinite(value) && value >= 0) return value;
  }
  return null;
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

function buildFood(rec: FdcRecord, source: "F" | "S"): BundleFood | null {
  if (typeof rec.fdcId !== "number" || !Number.isFinite(rec.fdcId)) return null;
  const desc = (rec.description ?? "").trim();
  if (!desc) return null;
  const nutrients = Array.isArray(rec.foodNutrients) ? rec.foodNutrients : [];
  const kcal = extractNutrient(nutrients, NUTRIENT_IDS.KCAL);
  const protein = extractNutrient(nutrients, NUTRIENT_IDS.PROTEIN);
  const fat = extractNutrient(nutrients, NUTRIENT_IDS.FAT);
  const carbs = extractNutrient(nutrients, NUTRIENT_IDS.CARBS);
  const fiber = extractNutrient(nutrients, NUTRIENT_IDS.FIBER) ?? 0;
  if (kcal == null || protein == null || fat == null || carbs == null) return null;
  const catRaw = rec.foodCategory?.description;
  const cat =
    typeof catRaw === "string" && catRaw.trim() ? catRaw.trim().slice(0, 60) : null;
  return {
    id: rec.fdcId,
    desc: desc.slice(0, 120),
    kcal: round1(kcal),
    p: round1(protein),
    f: round1(fat),
    c: round1(carbs),
    fb: round1(fiber),
    cat,
    src: source,
  };
}

function loadFile(
  path: string,
  source: "F" | "S",
  expectedKey: "FoundationFoods" | "SRLegacyFoods",
): BundleFood[] {
  const raw = readFileSync(path, "utf8");
  const parsed = JSON.parse(raw) as FdcFile;
  const list = parsed[expectedKey];
  if (!Array.isArray(list)) {
    throw new Error(
      `Expected top-level key "${expectedKey}" in ${path}, but it was ${JSON.stringify(Object.keys(parsed))}.`,
    );
  }
  const out: BundleFood[] = [];
  let dropped = 0;
  for (const rec of list) {
    const food = buildFood(rec, source);
    if (food) out.push(food);
    else dropped += 1;
  }
  console.log(`[fdc] ${path.split(/[\\/]/).pop()}: ${list.length} records, ${out.length} usable, ${dropped} dropped (missing macros)`);
  return out;
}

// ---------------------------------------------------------------------------
// Indian alias table. Each `name` is what a user types. `targets` are the
// FDC descriptions we try in order (exact case-insensitive match). On any
// alias where zero targets match, we warn and skip — never fuzzy-guess at
// build time. Use `--find <keyword>` to discover exact FDC descriptions.
//
// `approximate: true` entries emit a warning note at response time like
// "Approximated from USDA <desc> — macros may differ from your homemade
// version". `portionGrams` is the fallback for "1 bowl/cup/piece <name>"
// inputs (explicit "100g" always wins; no portion → that part falls to AI).
// ---------------------------------------------------------------------------

const INDIAN_ALIASES: AliasEntry[] = [
  // ── Indian approximations (conf 0.85 + note) ─────────────────────
  // (khichdi / poha / upma / idli / dosa are handled by Layer 1 curated KB.
  //  FDC aliases for them were dead code — curated always wins first.)

  // ── Dairy / cheese approximations ────────────────────────────────
  { name: 'paneer',    targets: ['Cheese, cottage, creamed, large or small curd', 'Cheese, cottage, lowfat, 2% milkfat', 'Cheese, cottage, nonfat, uncreamed, dry, large or small curd'], approximate: true, portionGrams: 30 },

  // ── Exact matches (conf 1.0, no note) ────────────────────────────
  { name: 'ghee',       targets: ['Butter oil, anhydrous'],                                                approximate: false, portionGrams: 5 },
  { name: 'butter',     targets: ['Butter, salted', 'Butter, without salt'],                                approximate: false, portionGrams: 5 },
  { name: 'curd',       targets: ['Yogurt, plain, whole milk'],                                            approximate: false, portionGrams: 200 },
  { name: 'dahi',       targets: ['Yogurt, plain, whole milk'],                                            approximate: false, portionGrams: 200 },
  { name: 'greek yogurt', targets: ['Yogurt, Greek, plain, nonfat', 'Yogurt, Greek, plain, whole milk'],    approximate: false, portionGrams: 150 },
  { name: 'milk',       targets: ['Milk, whole, 3.25% milkfat, with added vitamin D', 'Milk, reduced fat, fluid, 2% milkfat, with added vitamin A and vitamin D'], approximate: false, portionGrams: 240 },
  { name: 'toned milk', targets: ['Milk, lowfat, fluid, 1% milkfat, with added vitamin A and vitamin D'],    approximate: false, portionGrams: 240 },
  { name: 'skim milk',  targets: ['Milk, nonfat, fluid, with added vitamin A and vitamin D (fat free or skim)'], approximate: false, portionGrams: 240 },
  { name: 'cream',      targets: ['Cream, fluid, heavy whipping'],                                          approximate: false, portionGrams: 15 },
  { name: 'lassi',      targets: ['Yogurt, plain, whole milk'],                                             approximate: true, portionGrams: 240 },
  { name: 'buttermilk', targets: ['Milk, buttermilk, fluid, cultured, lowfat'],                             approximate: false, portionGrams: 240 },

  // ── Legumes ──────────────────────────────────────────────────────
  { name: 'dal',        targets: ['Lentils, mature seeds, cooked, boiled, without salt'],                   approximate: false, portionGrams: 150 },
  { name: 'toor dal',   targets: ['Pigeon peas (red gram), mature seeds, cooked, boiled, without salt'],     approximate: false, portionGrams: 150 },
  { name: 'moong dal',  targets: ['Mung beans, mature seeds, cooked, boiled, without salt'],                approximate: false, portionGrams: 150 },
  { name: 'masoor dal', targets: ['Lentils, pink or red, mature seeds, cooked, boiled, without salt', 'Lentils, mature seeds, cooked, boiled, without salt'], approximate: false, portionGrams: 150 },
  { name: 'chana dal',  targets: ['Chickpeas (garbanzo beans, bengal gram), mature seeds, cooked, boiled, without salt'], approximate: false, portionGrams: 150 },
  { name: 'rajma',      targets: ['Beans, kidney, all types, mature seeds, cooked, boiled, without salt'],  approximate: false, portionGrams: 150 },
  { name: 'chole',      targets: ['Chickpeas (garbanzo beans, bengal gram), mature seeds, cooked, boiled, without salt'], approximate: false, portionGrams: 150 },
  { name: 'lobia',      targets: ['Cowpeas, catjang, mature seeds, cooked, boiled, without salt'],           approximate: false, portionGrams: 150 },
  { name: 'soya chunks', targets: ['Soy protein concentrate, produced by acid wash'],                       approximate: true, portionGrams: 50 },
  { name: 'sprouts',    targets: ['Mung beans, mature seeds, sprouted, raw'],                               approximate: false, portionGrams: 100 },

  // ── Cereals / grains ─────────────────────────────────────────────
  { name: 'oats',       targets: ["Oats (Includes foods for USDA's Food Distribution Program)"],           approximate: false },
  { name: 'quinoa',     targets: ['Quinoa, uncooked', 'Quinoa, cooked'],                                    approximate: false, portionGrams: 100 },
  { name: 'rice',       targets: ['Rice, white, short-grain, cooked, unenriched'],                          approximate: false, portionGrams: 150 },
  { name: 'brown rice', targets: ['Rice, brown, long-grain, cooked, unenriched'],                           approximate: false, portionGrams: 150 },
  { name: 'bread',      targets: ['Bread, white, commercially prepared (includes soft bread crumbs)'],       approximate: false, portionGrams: 30 },
  { name: 'roti',       targets: ['Bread, chapati or roti, whole wheat, commercially prepared, frozen'],     approximate: true, portionGrams: 40 },
  { name: 'chapati',    targets: ['Bread, chapati or roti, whole wheat, commercially prepared, frozen'],     approximate: true, portionGrams: 40 },
  { name: 'naan',       targets: ['Bread, naan, plain, commercially prepared, refrigerated'],                approximate: true, portionGrams: 90 },
  { name: 'pasta',      targets: ['Pasta, cooked, unenriched, without added salt'],                          approximate: false, portionGrams: 150 },

  // ── Millets ──────────────────────────────────────────────────────
  { name: 'bajra',      targets: ['Millet, cooked'],                                                        approximate: false, portionGrams: 150 },
  { name: 'jowar',      targets: ['Sorghum grain', 'Sorghum flour, whole-grain'],                           approximate: true, portionGrams: 150 },
  { name: 'ragi',       targets: ['Millet, cooked'],                                                        approximate: true, portionGrams: 150 },
  { name: 'sabudana',   targets: ['Tapioca, pearl, dry'],                                                   approximate: false, portionGrams: 50 },

  // ── Non-veg ──────────────────────────────────────────────────────
  { name: 'chicken breast', targets: ['Chicken, broilers or fryers, breast, meat only, cooked, roasted', 'Chicken, broilers or fryers, breast, meat only, cooked, grilled', 'Chicken, broilers or fryers, breast, meat only, raw'], approximate: false, portionGrams: 100 },
  { name: 'chicken',    targets: ['Chicken, broilers or fryers, meat and skin, cooked, roasted', 'Chicken, broilers or fryers, meat only, cooked, roasted'], approximate: false, portionGrams: 100 },
  { name: 'mutton',     targets: ['Lamb, composite of trimmed retail cuts, separable lean and fat, trimmed to 1/4" fat, choice, cooked'], approximate: false, portionGrams: 100 },
  { name: 'fish',       targets: ['Fish, salmon, Atlantic, farmed, cooked, dry heat', 'Fish, tilapia, cooked, dry heat'], approximate: false, portionGrams: 100 },
  { name: 'egg',        targets: ['Egg, whole, raw, fresh', 'Egg, whole, cooked, hard-boiled'],             approximate: false, portionGrams: 50 },
  { name: 'egg white',  targets: ['Egg, white, raw, fresh'],                                                approximate: false, portionGrams: 33 },
  { name: 'whey protein', targets: ['Whey, acid, fluid', 'Whey, sweet, fluid'],                             approximate: true, portionGrams: 30 },

  // ── Nuts / seeds ─────────────────────────────────────────────────
  { name: 'almond',     targets: ['Nuts, almonds'],                                                         approximate: false, portionGrams: 1.2 },
  { name: 'cashew',     targets: ['Nuts, cashew nuts, raw'],                                                approximate: false, portionGrams: 1.6 },
  { name: 'peanut',     targets: ['Peanuts, all types, raw'],                                               approximate: false, portionGrams: 1 },
  { name: 'walnut',     targets: ['Nuts, walnuts, english'],                                                approximate: false, portionGrams: 4 },

  // ── Fruit ────────────────────────────────────────────────────────
  { name: 'apple',      targets: ["Apples, raw, gala, with skin (Includes foods for USDA's Food Distribution Program)"], approximate: false, portionGrams: 180 },
  { name: 'banana',     targets: ['Bananas, raw'],                                                          approximate: false, portionGrams: 120 },
  { name: 'mango',      targets: ['Mangos, raw'],                                                           approximate: false, portionGrams: 200 },
  { name: 'orange',     targets: ['Oranges, raw, all commercial varieties'],                                approximate: false, portionGrams: 140 },
  { name: 'guava',      targets: ['Guavas, common, raw'],                                                   approximate: false, portionGrams: 150 },
  { name: 'grapes',     targets: ['Grapes, red or green (European type, such as Thompson seedless), raw'],   approximate: false, portionGrams: 150 },
  { name: 'watermelon', targets: ['Watermelon, raw'],                                                       approximate: false, portionGrams: 200 },
  { name: 'papaya',     targets: ['Papayas, raw'],                                                          approximate: false, portionGrams: 150 },
  { name: 'pomegranate',targets: ['Pomegranates, raw'],                                                     approximate: false, portionGrams: 150 },
];

// ---------------------------------------------------------------------------
// Merge / dedupe. Foundation wins on fdcId overlap.
// ---------------------------------------------------------------------------

function mergeFoundationWins(foundation: BundleFood[], srLegacy: BundleFood[]): BundleFood[] {
  const byId = new Map<number, BundleFood>();
  for (const f of foundation) byId.set(f.id, f);
  for (const f of srLegacy) if (!byId.has(f.id)) byId.set(f.id, f);
  return Array.from(byId.values());
}

// ---------------------------------------------------------------------------
// Alias matching. Exact (case-insensitive, whitespace-normalized) description
// equality only. Each alias picks the FIRST target that resolves to a food
// in the merged set. Aliases with zero matching targets are skipped with a
// clear warning plus top-3 Dice suggestions so the user can fix the target.
// ---------------------------------------------------------------------------

function normalizeDesc(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

function buildAliasIndex(
  foods: BundleFood[],
  aliases: AliasEntry[],
): { aliases: Record<string, AliasRef>; targetSet: Set<string>; matched: number; missed: number } {
  const byDesc = new Map<string, BundleFood>();
  for (const f of foods) {
    const key = normalizeDesc(f.desc);
    // Foundation is merged first; do not overwrite an existing Foundation hit.
    if (!byDesc.has(key) || (byDesc.get(key)!.src === 'S' && f.src === 'F')) {
      byDesc.set(key, f);
    }
  }

  const aliasIndex: Record<string, AliasRef> = {};
  const targetSet = new Set<string>();
  let matched = 0;
  let missed = 0;

  for (const a of aliases) {
    let chosen: BundleFood | null = null;
    for (const t of a.targets) {
      const key = normalizeDesc(t);
      targetSet.add(key);
      if (chosen) continue;
      const hit = byDesc.get(key);
      if (hit) chosen = hit;
    }
    if (!chosen) {
      missed += 1;
      console.warn(`[alias] MISS "${a.name}" — none of ${a.targets.length} target(s) matched.`);
      // Top-3 Dice suggestions so the user can fix the target list.
      const query = normalizeDesc(a.name);
      const scored = foods
        .map((f) => ({ f, score: diceForBuild(query, normalizeDesc(f.desc)) }))
        .filter((x) => x.score >= 0.35)
        .sort((x, y) => y.score - x.score)
        .slice(0, 3);
      for (const s of scored) {
        console.warn(`         suggestion (${s.score.toFixed(2)}): "${s.f.desc}"`);
      }
      continue;
    }
    aliasIndex[a.name] = {
      id: chosen.id,
      approx: a.approximate,
      portion: a.portionGrams ?? null,
      note: a.note ?? null,
    };
    matched += 1;
  }
  return { aliases: aliasIndex, targetSet, matched, missed };
}

// Tiny build-time Dice so we can suggest fixes. Runtime similarity lives in
// _shared/similarity.ts and is imported by parse-meal, not by this script.
function diceForBuild(a: string, b: string): number {
  const bigrams = (s: string): Set<string> => {
    const out = new Set<string>();
    const t = ` ${s} `;
    for (let i = 0; i < t.length - 1; i++) out.add(t.slice(i, i + 2));
    return out;
  };
  const A = bigrams(a);
  const B = bigrams(b);
  if (A.size === 0 && B.size === 0) return 1;
  let inter = 0;
  for (const g of A) if (B.has(g)) inter++;
  return (2 * inter) / (A.size + B.size);
}

// ---------------------------------------------------------------------------
// Size check + overflow fallback
// ---------------------------------------------------------------------------

const MAX_BUNDLE_BYTES = 400 * 1024;

function serializeBundle(bundle: Bundle): Buffer {
  // Compact: no extra whitespace, keys already short.
  return Buffer.from(JSON.stringify(bundle), 'utf8');
}

function compactSrLegacy(foods: BundleFood[], targetSet: Set<string>): BundleFood[] {
  return foods.filter((f) => {
    if (f.src === 'F') return true;
    return targetSet.has(normalizeDesc(f.desc));
  });
}

// ---------------------------------------------------------------------------
// CLI helpers
// ---------------------------------------------------------------------------

function findDescriptions(foods: BundleFood[], keyword: string): void {
  const needle = keyword.toLowerCase();
  const hits = foods.filter((f) => f.desc.toLowerCase().includes(needle));
  console.log(`\n[fdc] ${hits.length} description(s) containing "${keyword}":`);
  for (const f of hits.slice(0, 40)) {
    console.log(`  [${f.src}] ${f.id}  ${f.desc}`);
  }
  if (hits.length > 40) console.log(`  … ${hits.length - 40} more`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const args = process.argv.slice(2);

  const findIdx = args.indexOf('--find');
  const findKeyword = findIdx >= 0 ? args[findIdx + 1] : null;
  const dryRun = args.includes('--dry-run');

  console.log('[fdc] loading Foundation…');
  const foundation = loadFile(FOUNDATION_PATH, 'F', 'FoundationFoods');
  console.log('[fdc] loading SR Legacy…');
  const srLegacy = loadFile(SR_LEGACY_PATH, 'S', 'SRLegacyFoods');

  const merged = mergeFoundationWins(foundation, srLegacy);
  console.log(`[fdc] merged: ${merged.length} foods (Foundation ${foundation.length}, SR Legacy ${srLegacy.length})`);

  if (findKeyword) {
    findDescriptions(merged, findKeyword);
    return;
  }

  console.log('[fdc] building alias index…');
  const aliasBuild = buildAliasIndex(merged, INDIAN_ALIASES);
  console.log(`[fdc] aliases: ${aliasBuild.matched} matched, ${aliasBuild.missed} missed`);

  // First pass: full merged bundle.
  const fullBundle: Bundle = { foods: merged, aliases: aliasBuild.aliases };
  const fullBytes = serializeBundle(fullBundle);
  console.log(`[fdc] full bundle: ${(fullBytes.length / 1024).toFixed(1)} KB`);

  let finalFoods = merged;
  let finalBytes = fullBytes;

  if (fullBytes.length > MAX_BUNDLE_BYTES) {
    console.log(`[fdc] over ${MAX_BUNDLE_BYTES / 1024}KB — trimming SR Legacy to alias-targeted records only…`);
    finalFoods = compactSrLegacy(merged, aliasBuild.targetSet);
    const compactBundle: Bundle = { foods: finalFoods, aliases: aliasBuild.aliases };
    finalBytes = serializeBundle(compactBundle);
    const keptF = finalFoods.filter((f) => f.src === 'F').length;
    const keptS = finalFoods.filter((f) => f.src === 'S').length;
    console.log(`[fdc] compacted: ${(finalBytes.length / 1024).toFixed(1)} KB (Foundation ${keptF}, SR Legacy ${keptS})`);
    if (finalBytes.length > MAX_BUNDLE_BYTES) {
      throw new Error(
        `Bundle still exceeds ${MAX_BUNDLE_BYTES / 1024}KB after SR Legacy trimming (${(finalBytes.length / 1024).toFixed(1)} KB). ` +
        `Reduce alias target set, or drop Foundation Full as a follow-up.`,
      );
    }
  }

  // Defensive: drop orphaned alias refs (aliases pointing to foods that did not
  // survive the trim). This should not happen because we keep alias-targeted
  // SR Legacy, but guard against future changes.
  const idSet = new Set(finalFoods.map((f) => f.id));
  const finalAliases: Record<string, AliasRef> = {};
  let orphans = 0;
  for (const [name, ref] of Object.entries(aliasBuild.aliases)) {
    if (idSet.has(ref.id)) finalAliases[name] = ref;
    else orphans += 1;
  }
  if (orphans > 0) {
    console.warn(`[fdc] dropped ${orphans} orphaned alias ref(s) pointing to trimmed foods`);
  }

  const out: Bundle = { foods: finalFoods, aliases: finalAliases };
  const outBytes = serializeBundle(out);

  if (dryRun) {
    console.log(`[fdc] DRY RUN — would write ${(outBytes.length / 1024).toFixed(1)} KB to ${OUT_JSON}`);
    return;
  }

  writeFileSync(OUT_JSON, outBytes);
  console.log(`[fdc] wrote ${(outBytes.length / 1024).toFixed(1)} KB to ${OUT_JSON}`);
  console.log(`[fdc] final: ${out.foods.length} foods, ${Object.keys(out.aliases).length} aliases`);
}

main();