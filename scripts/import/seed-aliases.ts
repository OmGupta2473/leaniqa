/**
 * Seed food_aliases and the ambiguity tables into staging.
 *
 * All alias keys are POST-NORMALIZATION. Constraint on food_aliases.alias
 * rejects pre-normalization tokens (katori, katoris, bowls, glasses, cups,
 * pieces, slices, scoops, grams, gms). This script validates every key
 * locally before insert so a single typo doesn't abort a 200-row seed.
 *
 * Collision rule:
 *   An alias key MUST NOT equal a *different* food's canonical_name. If it
 *   does, either rename the alias or merge the foods. Collision check uses
 *   the curated dish list statically in dry-run mode, and the live `foods`
 *   table on a live write (which is a superset when USDA is imported).
 *
 * SAFETY: refuses to run without STAGING_SUPABASE_URL and
 * STAGING_SUPABASE_SERVICE_ROLE_KEY. Verifies target ref via
 * _validate-target.ts. Never targets production.
 *
 * Usage:
 *   npx tsx scripts/import/seed-aliases.ts --dry-run   # file-only validation
 *   npx tsx scripts/import/seed-aliases.ts             # live write
 */

import 'dotenv/config';
import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { assertStagingTarget, assertProductionTarget } from './_validate-target';
import { CURATED_INDIAN_DISHES } from './data/curated-indian-dishes';

loadEnv({ path: '.env' });
loadEnv({ path: '.env.local', override: true });

// JS word boundaries. \m and \M are PostgreSQL-only and would be treated
// as literals by JavaScript, silently letting bad keys through.
const FORBIDDEN_TOKENS =
  /\b(bowls|katoris|katori|glasses|cups|pieces|slices|scoops|grams|gms)\b/i;

interface AliasSeed {
  alias: string;
  food_source_id: string;
  portion_grams?: number;
  portion_unit?: string;
  source?: 'seed' | 'user' | 'promoted';
  confidence?: number;
}

const ALIASES: AliasSeed[] = [
  // ---- Household measures with explicit portions ----
  { alias: 'bowl dal',              food_source_id: 'curated:dal-toor',          portion_grams: 150, portion_unit: 'bowl' },
  { alias: 'bowl dal makhani',      food_source_id: 'curated:dal-makhani',       portion_grams: 150, portion_unit: 'bowl' },
  { alias: 'bowl dal tadka',        food_source_id: 'curated:dal-tadka',         portion_grams: 150, portion_unit: 'bowl' },
  { alias: 'bowl moong dal',        food_source_id: 'curated:moong-dal',         portion_grams: 150, portion_unit: 'bowl' },
  { alias: 'bowl masoor dal',       food_source_id: 'curated:masoor-dal',        portion_grams: 150, portion_unit: 'bowl' },
  { alias: 'bowl rajma',            food_source_id: 'curated:rajma',             portion_grams: 150, portion_unit: 'bowl' },
  { alias: 'bowl chole',            food_source_id: 'curated:chole',             portion_grams: 150, portion_unit: 'bowl' },
  { alias: 'bowl sambar',           food_source_id: 'curated:sambar',            portion_grams: 160, portion_unit: 'bowl' },
  { alias: 'bowl rasam',            food_source_id: 'curated:rasam',             portion_grams: 150, portion_unit: 'bowl' },
  { alias: 'bowl kadhi',            food_source_id: 'curated:kadhi',             portion_grams: 200, portion_unit: 'bowl' },
  { alias: 'bowl rice',             food_source_id: 'curated:rice-cooked',       portion_grams: 150, portion_unit: 'bowl' },
  { alias: 'bowl chawal',           food_source_id: 'curated:rice-cooked',       portion_grams: 150, portion_unit: 'bowl' },
  { alias: 'bowl brown rice',       food_source_id: 'curated:brown-rice-cooked', portion_grams: 150, portion_unit: 'bowl' },
  { alias: 'bowl jeera rice',       food_source_id: 'curated:jeera-rice',        portion_grams: 150, portion_unit: 'bowl' },
  { alias: 'bowl khichdi',          food_source_id: 'curated:khichdi',           portion_grams: 200, portion_unit: 'bowl' },
  { alias: 'bowl pongal',           food_source_id: 'curated:pongal',            portion_grams: 180, portion_unit: 'bowl' },
  { alias: 'bowl poha',             food_source_id: 'curated:poha',              portion_grams: 150, portion_unit: 'bowl' },
  { alias: 'bowl upma',             food_source_id: 'curated:upma',              portion_grams: 150, portion_unit: 'bowl' },
  { alias: 'plate upma',            food_source_id: 'curated:upma',              portion_grams: 200, portion_unit: 'plate' },
  { alias: 'bowl sabzi',            food_source_id: 'curated:mixed-veg',         portion_grams: 150, portion_unit: 'bowl' },
  { alias: 'bowl mix veg',          food_source_id: 'curated:mixed-veg',         portion_grams: 150, portion_unit: 'bowl' },
  { alias: 'bowl paneer',           food_source_id: 'curated:paneer-sabzi',      portion_grams: 150, portion_unit: 'bowl' },
  { alias: 'bowl palak paneer',     food_source_id: 'curated:palak-paneer',      portion_grams: 150, portion_unit: 'bowl' },
  { alias: 'bowl mutter paneer',    food_source_id: 'curated:mutter-paneer',     portion_grams: 150, portion_unit: 'bowl' },
  { alias: 'bowl chicken curry',    food_source_id: 'curated:chicken-curry',     portion_grams: 150, portion_unit: 'bowl' },
  { alias: 'bowl butter chicken',   food_source_id: 'curated:butter-chicken',    portion_grams: 200, portion_unit: 'bowl' },
  { alias: 'bowl mutton curry',     food_source_id: 'curated:mutton-curry',      portion_grams: 150, portion_unit: 'bowl' },
  { alias: 'bowl fish curry',       food_source_id: 'curated:fish-curry',        portion_grams: 150, portion_unit: 'bowl' },
  { alias: 'bowl egg curry',        food_source_id: 'curated:egg-curry',         portion_grams: 150, portion_unit: 'bowl' },
  { alias: 'bowl egg bhurji',       food_source_id: 'curated:egg-bhurji',        portion_grams: 120, portion_unit: 'bowl' },
  { alias: 'bowl curd',             food_source_id: 'curated:curd',              portion_grams: 200, portion_unit: 'bowl' },
  { alias: 'bowl dahi',             food_source_id: 'curated:curd',              portion_grams: 200, portion_unit: 'bowl' },
  { alias: 'bowl kheer',            food_source_id: 'curated:kheer',             portion_grams: 150, portion_unit: 'bowl' },
  { alias: 'bowl shrikhand',        food_source_id: 'curated:shrikhand',         portion_grams: 150, portion_unit: 'bowl' },
  { alias: 'bowl rabri',            food_source_id: 'curated:rabri',             portion_grams: 100, portion_unit: 'bowl' },
  { alias: 'bowl sprouts',          food_source_id: 'curated:sprouts',           portion_grams: 100, portion_unit: 'bowl' },
  { alias: 'bowl soya chunks curry',food_source_id: 'curated:soya-chunks-curry', portion_grams: 150, portion_unit: 'bowl' },

  { alias: 'cup milk',              food_source_id: 'curated:milk-whole',        portion_grams: 240, portion_unit: 'cup' },
  { alias: 'cup chai',              food_source_id: 'curated:chai',              portion_grams: 150, portion_unit: 'cup' },
  { alias: 'cup coffee',            food_source_id: 'curated:coffee',            portion_grams: 150, portion_unit: 'cup' },
  { alias: 'cup plain tea',         food_source_id: 'curated:plain-tea',         portion_grams: 240, portion_unit: 'cup' },
  { alias: 'cup curd',              food_source_id: 'curated:curd',              portion_grams: 245, portion_unit: 'cup' },

  { alias: 'glass milk',            food_source_id: 'curated:milk-whole',        portion_grams: 240, portion_unit: 'glass' },
  { alias: 'glass doodh',           food_source_id: 'curated:milk-whole',        portion_grams: 240, portion_unit: 'glass' },
  { alias: 'glass lassi',           food_source_id: 'curated:lassi-sweet',       portion_grams: 240, portion_unit: 'glass' },
  { alias: 'glass buttermilk',      food_source_id: 'curated:buttermilk',        portion_grams: 240, portion_unit: 'glass' },
  { alias: 'glass chaas',           food_source_id: 'curated:buttermilk',        portion_grams: 240, portion_unit: 'glass' },
  { alias: 'glass coconut water',   food_source_id: 'curated:coconut-water',     portion_grams: 240, portion_unit: 'glass' },

  // ---- Simple aliases ----
  { alias: 'chapatis',              food_source_id: 'curated:roti' },
  { alias: 'phulka',                food_source_id: 'curated:roti' },
  { alias: 'rotis',                 food_source_id: 'curated:roti' },
  { alias: 'paranthas',             food_source_id: 'curated:paratha' },
  { alias: 'parathas',              food_source_id: 'curated:paratha' },
  { alias: 'chawal',                food_source_id: 'curated:rice-cooked' },
  { alias: 'bhaat',                 food_source_id: 'curated:rice-cooked' },
  { alias: 'bhat',                  food_source_id: 'curated:rice-cooked' },
  { alias: 'white rice',            food_source_id: 'curated:rice-cooked' },
  { alias: 'cooked rice',           food_source_id: 'curated:rice-cooked' },
  { alias: 'brown chawal',          food_source_id: 'curated:brown-rice-cooked' },
  { alias: 'cumin rice',            food_source_id: 'curated:jeera-rice' },
  { alias: 'khichri',               food_source_id: 'curated:khichdi' },
  { alias: 'khichuri',              food_source_id: 'curated:khichdi' },
  { alias: 'pohe',                  food_source_id: 'curated:poha' },
  { alias: 'uppma',                 food_source_id: 'curated:upma' },
  { alias: 'uppitu',                food_source_id: 'curated:upma' },
  { alias: 'semiya',                food_source_id: 'curated:vermicelli-upma' },
  { alias: 'seviyan',               food_source_id: 'curated:vermicelli-upma' },
  { alias: 'idly',                  food_source_id: 'curated:idli' },
  { alias: 'iddli',                 food_source_id: 'curated:idli' },
  { alias: 'idlis',                 food_source_id: 'curated:idli' },
  { alias: 'dosai',                 food_source_id: 'curated:plain-dosa' },
  { alias: 'uthappam',              food_source_id: 'curated:uttapam' },
  { alias: 'ootapam',               food_source_id: 'curated:uttapam' },
  { alias: 'aloo gobi sabzi',       food_source_id: 'curated:aloo-gobi' },

  { alias: 'daal',                  food_source_id: 'curated:dal-toor' },
  { alias: 'dhal',                  food_source_id: 'curated:dal-toor' },
  { alias: 'toor dal',              food_source_id: 'curated:dal-toor' },
  { alias: 'arhar dal',             food_source_id: 'curated:dal-toor' },
  { alias: 'toovar dal',            food_source_id: 'curated:dal-toor' },
  { alias: 'mung dal',              food_source_id: 'curated:moong-dal' },
  { alias: 'green gram dal',        food_source_id: 'curated:moong-dal' },
  { alias: 'masur dal',             food_source_id: 'curated:masoor-dal' },
  { alias: 'red lentil dal',        food_source_id: 'curated:masoor-dal' },
  { alias: 'rajmah',                food_source_id: 'curated:rajma' },
  { alias: 'kidney beans',          food_source_id: 'curated:rajma' },
  { alias: 'chana masala',          food_source_id: 'curated:chole' },
  { alias: 'chickpea curry',        food_source_id: 'curated:chole' },
  { alias: 'cholay',                food_source_id: 'curated:chole' },
  { alias: 'chhole',                food_source_id: 'curated:chole' },
  { alias: 'sambhar',               food_source_id: 'curated:sambar' },
  { alias: 'sambhars',              food_source_id: 'curated:sambar' },
  { alias: 'kuzhambu',              food_source_id: 'curated:sambar' },
  { alias: 'ankurit',               food_source_id: 'curated:sprouts' },
  { alias: 'sprouted moong',        food_source_id: 'curated:sprouts' },
  { alias: 'meal maker',            food_source_id: 'curated:soya-chunks-curry' },
  { alias: 'nutrela',               food_source_id: 'curated:soya-chunks-curry' },

  { alias: 'aloo gobhi',            food_source_id: 'curated:aloo-gobi' },
  { alias: 'potato cauliflower',    food_source_id: 'curated:aloo-gobi' },
  { alias: 'okra',                  food_source_id: 'curated:bhindi-masala' },
  { alias: 'lady finger',           food_source_id: 'curated:bhindi-masala' },
  { alias: 'bhindi masala',         food_source_id: 'curated:bhindi-masala' },
  { alias: 'brinjal',               food_source_id: 'curated:baigan-bharta' },
  { alias: 'eggplant',              food_source_id: 'curated:baigan-bharta' },
  { alias: 'aubergine',             food_source_id: 'curated:baigan-bharta' },
  { alias: 'baingan',               food_source_id: 'curated:baigan-masala' },
  { alias: 'patta gobhi',           food_source_id: 'curated:cabbage-sabzi' },
  { alias: 'bandh gobi',            food_source_id: 'curated:cabbage-sabzi' },
  { alias: 'dudhi',                 food_source_id: 'curated:lauki-sabzi' },
  { alias: 'bottle gourd',          food_source_id: 'curated:lauki-sabzi' },
  { alias: 'opu',                   food_source_id: 'curated:lauki-sabzi' },
  { alias: 'sabji',                 food_source_id: 'curated:mixed-veg' },
  { alias: 'mixed veg',             food_source_id: 'curated:mixed-veg' },
  { alias: 'veg curry',             food_source_id: 'curated:mixed-veg' },
  { alias: 'spinach sabzi',         food_source_id: 'curated:palak-sabzi' },

  { alias: 'cottage cheese',        food_source_id: 'curated:paneer-raw' },
  { alias: 'spinach paneer',        food_source_id: 'curated:palak-paneer' },
  { alias: 'matar paneer',          food_source_id: 'curated:mutter-paneer' },
  { alias: 'peas paneer',           food_source_id: 'curated:mutter-paneer' },
  { alias: 'bhurji paneer',         food_source_id: 'curated:paneer-bhurji' },
  { alias: 'paneer curry',          food_source_id: 'curated:paneer-sabzi' },
  { alias: 'paneer sabji',          food_source_id: 'curated:paneer-sabzi' },

  { alias: 'murgh curry',           food_source_id: 'curated:chicken-curry' },
  { alias: 'chicken gravy',         food_source_id: 'curated:chicken-curry' },
  { alias: 'murgh makhani',         food_source_id: 'curated:butter-chicken' },
  { alias: 'grilled chicken',       food_source_id: 'curated:chicken-breast-grilled' },
  { alias: 'chicken breast grilled',food_source_id: 'curated:chicken-breast-grilled' },
  { alias: 'goat curry',            food_source_id: 'curated:mutton-curry' },
  { alias: 'lamb curry',            food_source_id: 'curated:mutton-curry' },
  { alias: 'machli curry',          food_source_id: 'curated:fish-curry' },
  { alias: 'eggs',                  food_source_id: 'curated:egg-whole' },
  { alias: 'anda',                  food_source_id: 'curated:egg-whole' },
  { alias: 'ande',                  food_source_id: 'curated:egg-whole' },
  { alias: 'boiled egg',            food_source_id: 'curated:egg-whole' },
  { alias: 'anda curry',            food_source_id: 'curated:egg-curry' },
  { alias: 'anda bhurji',           food_source_id: 'curated:egg-bhurji' },

  { alias: 'dahi',                  food_source_id: 'curated:curd' },
  { alias: 'yogurt',                food_source_id: 'curated:curd' },
  { alias: 'yoghurt',               food_source_id: 'curated:curd' },
  { alias: 'thayir',                food_source_id: 'curated:curd' },
  { alias: 'doodh',                 food_source_id: 'curated:milk-whole' },
  { alias: 'dudh',                  food_source_id: 'curated:milk-whole' },
  { alias: 'whole milk',            food_source_id: 'curated:milk-whole' },
  { alias: 'skim milk',             food_source_id: 'curated:milk-skimmed' },
  { alias: 'clarified butter',      food_source_id: 'curated:ghee' },
  { alias: 'makhan',                food_source_id: 'curated:butter' },
  { alias: 'vegetable oil',         food_source_id: 'curated:oil' },
  { alias: 'sunflower oil',         food_source_id: 'curated:oil' },
  { alias: 'mustard oil',           food_source_id: 'curated:oil' },
  { alias: 'chaas',                 food_source_id: 'curated:buttermilk' },
  { alias: 'mor',                   food_source_id: 'curated:buttermilk' },
  { alias: 'majjige',               food_source_id: 'curated:buttermilk' },

  { alias: 'samosas',               food_source_id: 'curated:samosa' },
  { alias: 'singara',               food_source_id: 'curated:samosa' },
  { alias: 'pakoda',                food_source_id: 'curated:pakora' },
  { alias: 'bhajiya',               food_source_id: 'curated:pakora' },
  { alias: 'vadapav',               food_source_id: 'curated:vada-pav' },
  { alias: 'vada pao',              food_source_id: 'curated:vada-pav' },
  { alias: 'dhoklas',               food_source_id: 'curated:dhokla' },
  { alias: 'khaman',                food_source_id: 'curated:dhokla' },
  { alias: 'golgappa',              food_source_id: 'curated:pani-puri' },
  { alias: 'gol gappa',             food_source_id: 'curated:pani-puri' },
  { alias: 'puchka',                food_source_id: 'curated:pani-puri' },
  { alias: 'momo',                  food_source_id: 'curated:momos-veg' },
  { alias: 'momos',                 food_source_id: 'curated:momos-veg' },
  { alias: 'dumpling',              food_source_id: 'curated:momos-veg' },
  { alias: 'biscuits',              food_source_id: 'curated:biscuit' },
  { alias: 'cookies',               food_source_id: 'curated:biscuit' },
  { alias: 'biskut',                food_source_id: 'curated:biscuit' },

  { alias: 'seb',                   food_source_id: 'curated:apple' },
  { alias: 'kela',                  food_source_id: 'curated:banana' },
  { alias: 'kelas',                 food_source_id: 'curated:banana' },
  { alias: 'aam',                   food_source_id: 'curated:mango' },
  { alias: 'amrood',                food_source_id: 'curated:guava' },
  { alias: 'angoor',                food_source_id: 'curated:grapes' },
  { alias: 'tarbuj',                food_source_id: 'curated:watermelon' },
  { alias: 'anar',                  food_source_id: 'curated:pomegranate' },
  { alias: 'sapota',                food_source_id: 'curated:chikoo' },
  { alias: 'ananas',                food_source_id: 'curated:pineapple' },
  { alias: 'badam',                 food_source_id: 'curated:almond' },
  { alias: 'almonds',               food_source_id: 'curated:almond' },
  { alias: 'kaju',                  food_source_id: 'curated:cashew' },
  { alias: 'cashews',               food_source_id: 'curated:cashew' },
  { alias: 'moongfali',             food_source_id: 'curated:peanut' },
  { alias: 'groundnut',             food_source_id: 'curated:peanut' },
  { alias: 'peanuts',               food_source_id: 'curated:peanut' },
  { alias: 'akhrot',                food_source_id: 'curated:walnut' },
  { alias: 'walnuts',               food_source_id: 'curated:walnut' },

  { alias: 'kaapi',                 food_source_id: 'curated:coffee' },
  { alias: 'filter coffee',         food_source_id: 'curated:coffee' },
  { alias: 'black tea',             food_source_id: 'curated:plain-tea' },
  { alias: 'nariyal pani',          food_source_id: 'curated:coconut-water' },

  { alias: 'payasam',               food_source_id: 'curated:kheer' },
  { alias: 'payesh',                food_source_id: 'curated:kheer' },
  { alias: 'rosogolla',             food_source_id: 'curated:rasgulla' },
  { alias: 'gulabjamun',            food_source_id: 'curated:gulab-jamun' },
  { alias: 'srikhand',              food_source_id: 'curated:shrikhand' },
  { alias: 'rabadi',                food_source_id: 'curated:rabri' },

  // ---- Composite dish aliases ----
  { alias: 'rajma chawal',          food_source_id: 'curated:rajma-chawal',   portion_grams: 300, portion_unit: 'bowl' },
  { alias: 'bowl rajma chawal',     food_source_id: 'curated:rajma-chawal',   portion_grams: 300, portion_unit: 'bowl' },
  { alias: 'rajmah chawal',         food_source_id: 'curated:rajma-chawal',   portion_grams: 300, portion_unit: 'bowl' },
  { alias: 'rajma rice',            food_source_id: 'curated:rajma-chawal',   portion_grams: 300, portion_unit: 'bowl' },
  { alias: 'dal chawal',            food_source_id: 'curated:dal-chawal',     portion_grams: 300, portion_unit: 'bowl' },
  { alias: 'dal rice',              food_source_id: 'curated:dal-chawal',     portion_grams: 300, portion_unit: 'bowl' },
  { alias: 'roti sabzi',            food_source_id: 'curated:roti-sabzi' },
  { alias: 'roti sabji',            food_source_id: 'curated:roti-sabzi' },
];

// ---------------------------------------------------------------------------
// Ambiguity: these terms are ALWAYS an overlay. When the input contains one
// of these terms, the resolver returns a default estimate AND flags the item
// as ambiguous regardless of which layer resolved the food. Ambiguity is not
// a fallback — it is orthogonal to resolution.
// ---------------------------------------------------------------------------
const AMBIGUOUS: Record<string, { candidates: string[]; notes: string }> = {
  dal: {
    candidates: ['curated:dal-toor', 'curated:dal-makhani', 'curated:moong-dal', 'curated:masoor-dal'],
    notes: 'Type unclear without more context.',
  },
  sabzi: {
    candidates: ['curated:mixed-veg', 'curated:aloo-gobi', 'curated:bhindi-masala', 'curated:palak-paneer'],
    notes: 'Vegetable type unclear.',
  },
  sabji: {
    candidates: ['curated:mixed-veg', 'curated:aloo-gobi', 'curated:bhindi-masala', 'curated:palak-paneer'],
    notes: 'Vegetable type unclear.',
  },
  curry: {
    candidates: ['curated:chicken-curry', 'curated:egg-curry', 'curated:fish-curry', 'curated:paneer-sabzi', 'curated:mutton-curry'],
    notes: 'Curry base unclear.',
  },
  'soya chunks': {
    candidates: ['curated:soya-chunks-curry'],
    notes: 'Could be raw ingredient or curry. Default to curry with confirmation.',
  },
  tea: {
    candidates: ['curated:chai', 'curated:plain-tea'],
    notes: 'Milk + sugar unknown. Default to chai with confirmation.',
  },
  biryani: {
    candidates: ['curated:chicken-biryani', 'curated:mutton-biryani', 'curated:veg-biryani'],
    notes: 'Biryani type unclear.',
  },
};

interface ValidationIssue {
  kind: 'bad_alias_token' | 'collision' | 'missing_food' | 'duplicate_alias';
  key: string;
  detail: string;
}

// ---------------------------------------------------------------------------
// Local-only validation. Runs in both dry-run and live. Never touches the DB.
// Uses the curated dish file as the source of canonical names, so it works
// before the foods table is populated.
// ---------------------------------------------------------------------------

function validateLocally(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // 1. Bad tokens in alias keys.
  for (const a of ALIASES) {
    if (FORBIDDEN_TOKENS.test(a.alias)) {
      issues.push({
        kind: 'bad_alias_token',
        key: a.alias,
        detail: 'contains a pre-normalization unit token',
      });
    }
  }

  // 2. Duplicate aliases in the file itself.
  //    (a) same alias -> two different foods: semantically dangerous
  //    (b) same alias -> same food twice: safe semantically, but
  //        Postgres's ON CONFLICT DO UPDATE rejects the batch, so it
  //        must be caught before the write.
  const seen = new Map<string, string>();
  const seenKeys = new Set<string>();
  for (const a of ALIASES) {
    const prior = seen.get(a.alias);
    if (prior && prior !== a.food_source_id) {
      issues.push({
        kind: 'duplicate_alias',
        key: a.alias,
        detail: `aliased to both ${prior} and ${a.food_source_id}`,
      });
    } else {
      seen.set(a.alias, a.food_source_id);
    }

    const key = `${a.alias}|${a.food_source_id}`;
    if (seenKeys.has(key)) {
      issues.push({
        kind: 'duplicate_alias',
        key: a.alias,
        detail: `appears more than once with food_source_id ${a.food_source_id}`,
      });
    } else {
      seenKeys.add(key);
    }
  }

  // 3. Collision: an alias key equals a *different* curated canonical_name.
  //    Uses the static curated list so this works without the DB.
  const canonicalToSource = new Map<string, string>();
  for (const dish of CURATED_INDIAN_DISHES) {
    canonicalToSource.set(dish.canonical_name, dish.source_id);
  }
  for (const a of ALIASES) {
    const owner = canonicalToSource.get(a.alias);
    if (owner && owner !== a.food_source_id) {
      issues.push({
        kind: 'collision',
        key: a.alias,
        detail: `alias points to ${a.food_source_id} but "${a.alias}" is a canonical name of ${owner}`,
      });
    }
  }

  // 4. Every referenced food exists in the curated file.
  //    (Live will additionally verify against the DB — superset of this.)
  const knownSources = new Set(CURATED_INDIAN_DISHES.map((d) => d.source_id));
  const referenced = new Set<string>([
    ...ALIASES.map((a) => a.food_source_id),
    ...Object.values(AMBIGUOUS).flatMap((x) => x.candidates),
  ]);
  for (const sid of referenced) {
    if (!knownSources.has(sid)) {
      issues.push({
        kind: 'missing_food',
        key: sid,
        detail: 'referenced by an alias or ambiguity candidate but not present in the curated dish file',
      });
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  // 1. Verify target.
  // Phase 6.7 R2.9 — same dispatch pattern as import-foods.ts.
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
  console.log(`Dry run:  ${dryRun ? 'YES' : 'no'}`);
  console.log('');

  // 2. Local validation (both modes).
  const issues = validateLocally();
  if (issues.length) {
    console.error(`Local validation failed (${issues.length}):`);
    for (const i of issues) console.error(`  [${i.kind}] ${i.key}: ${i.detail}`);
    process.exit(1);
  }
  console.log(`Validated ${ALIASES.length} alias keys locally.`);
  console.log(`No canonical/alias collisions in the curated file.`);

  // 3. Dry-run stops here. No DB access needed — the file is self-consistent.
  if (dryRun) {
    console.log('');
    console.log('Dry run complete. No writes performed.');
    console.log(
      `Would upsert ${ALIASES.length} aliases and ${Object.keys(AMBIGUOUS).length} ambiguous terms ` +
      `against staging on a live run.`,
    );
    process.exit(0);
  }

  // 4. Live: verify references against the DB (superset check).
  console.log('');
  console.log('Verifying references against staging...');
  const supabaseUrl = targetEnv === 'staging'
    ? process.env.STAGING_SUPABASE_URL!
    : process.env.PROD_SUPABASE_URL!;
  const supabaseKey = targetEnv === 'staging'
    ? process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY!
    : process.env.PROD_SUPABASE_SERVICE_ROLE_KEY!;
  if (targetEnv === 'production' && process.env.CONFIRM_TARGET !== 'production') {
    console.error(
      'TARGET_ENV=production requires CONFIRM_TARGET=production env var.\n' +
      'This is a safety guard. Refusing to write.',
    );
    process.exit(1);
  }
  const supabase = createClient(
    supabaseUrl,
    supabaseKey,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const referenced = new Set<string>([
    ...ALIASES.map((a) => a.food_source_id),
    ...Object.values(AMBIGUOUS).flatMap((x) => x.candidates),
  ]);

  const { data: foods, error: foodsError } = await supabase
    .from('foods')
    .select('id, source_id')
    .in('source_id', Array.from(referenced));

  if (foodsError) {
    console.error(`Food lookup failed: ${foodsError.message}`);
    process.exit(1);
  }
  const idBySource = new Map<string, number>();
  for (const f of foods ?? []) idBySource.set(f.source_id, f.id);

  const missing = Array.from(referenced).filter((s) => !idBySource.has(s));
  if (missing.length) {
    console.error(`Missing foods (run import-foods.ts live first):`);
    for (const m of missing) console.error(`  - ${m}`);
    process.exit(1);
  }
  console.log(`Found ${idBySource.size}/${referenced.size} referenced foods in staging.`);

  // 5. Write aliases.
  const aliasRows = ALIASES.map((a) => ({
    alias: a.alias,
    food_id: idBySource.get(a.food_source_id)!,
    portion_grams: a.portion_grams ?? null,
    portion_unit: a.portion_unit ?? null,
    source: a.source ?? 'seed',
    confidence: a.confidence ?? 1.0,
  }));

  // Defense in depth: Postgres's ON CONFLICT DO UPDATE cannot affect the
  // same target row twice in one INSERT. Dedupe by the conflict key and
  // report any duplicates so the source file can be cleaned separately.
  const seenKeys = new Set<string>();
  const dedupedRows: typeof aliasRows = [];
  const duplicates: string[] = [];
  for (const row of aliasRows) {
    const key = `${row.alias}|${row.food_id}`;
    if (seenKeys.has(key)) {
      duplicates.push(key);
      continue;
    }
    seenKeys.add(key);
    dedupedRows.push(row);
  }
  if (duplicates.length > 0) {
    console.warn(`Warning: ${duplicates.length} duplicate (alias, food_id) pair(s) in ALIASES:`);
    for (const d of duplicates) console.warn(`  ${d}`);
  }

  const { error: aliasError } = await supabase
    .from('food_aliases')
    .upsert(dedupedRows, { onConflict: 'alias,food_id' });
  if (aliasError) {
    console.error(`Alias insert failed: ${aliasError.message}`);
    process.exit(1);
  }
  console.log(`Upserted ${dedupedRows.length} aliases (${duplicates.length} duplicate(s) skipped).`);

  // 6. Write ambiguous terms + candidates.
  let termCount = 0;
  let candidateCount = 0;
  for (const [term, info] of Object.entries(AMBIGUOUS)) {
    const { error: tErr } = await supabase
      .from('food_ambiguous_terms')
      .upsert({ term, notes: info.notes }, { onConflict: 'term' });
    if (tErr) { console.error(`  term ${term}: ${tErr.message}`); process.exit(1); }
    termCount += 1;

    const cands = info.candidates.map((cid, rank) => ({
      term,
      food_id: idBySource.get(cid)!,
      rank,
    }));
    const { error: cErr } = await supabase
      .from('food_ambiguous_candidates')
      .upsert(cands, { onConflict: 'term,food_id' });
    if (cErr) { console.error(`  candidates for ${term}: ${cErr.message}`); process.exit(1); }
    candidateCount += cands.length;
  }
  console.log(`Upserted ${termCount} ambiguous terms, ${candidateCount} candidates.`);
  console.log('');
  console.log('Seed complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});