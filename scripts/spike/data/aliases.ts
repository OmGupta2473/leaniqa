// Indian household measures and multi-word aliases → canonical food id.
// Portion overrides: an alias can imply a portion (e.g. "katori dal" → 150g).
//
// This file is intentionally separate from foods.ts because aliases change
// far more frequently than food data, and the eval harness reads them
// independently.

export interface AliasEntry {
  alias: string;          // normalized lowercase key
  food_id: string;
  portion_grams?: number; // optional override of the food's default_portion_grams
  portion_label?: string;
}

export const ALIASES: AliasEntry[] = [
  // Household measure phrases
  { alias: 'katori dal',    food_id: 'dal_cooked', portion_grams: 150, portion_label: '1 katori' },
  { alias: 'bowl dal',      food_id: 'dal_cooked', portion_grams: 150, portion_label: '1 katori' },
  { alias: 'katori chawal', food_id: 'rice_cooked', portion_grams: 150, portion_label: '1 katori' },
  { alias: 'bowl rice',     food_id: 'rice_cooked', portion_grams: 150, portion_label: '1 katori' },
  { alias: 'katori rice',   food_id: 'rice_cooked', portion_grams: 150, portion_label: '1 katori' },
  { alias: 'katori sabzi',  food_id: 'mixed_veg',   portion_grams: 130, portion_label: '1 katori' },
  { alias: 'bowl sabzi',    food_id: 'mixed_veg',   portion_grams: 170, portion_label: '1 bowl' },
  { alias: 'bowl curd',     food_id: 'curd',        portion_grams: 200, portion_label: '1 katori' },
  { alias: 'glass milk',    food_id: 'milk',        portion_grams: 240, portion_label: '1 glass' },
  { alias: 'cup milk',      food_id: 'milk',        portion_grams: 240, portion_label: '1 cup' },
  { alias: 'bowl poha',     food_id: 'poha',        portion_grams: 150, portion_label: '1 bowl' },
  { alias: 'plate poha',    food_id: 'poha',        portion_grams: 200, portion_label: '1 plate' },
  { alias: 'bowl khichdi',  food_id: 'khichdi',     portion_grams: 200, portion_label: '1 bowl' },
  { alias: 'bowl upma',     food_id: 'upma',        portion_grams: 150, portion_label: '1 bowl' },
  { alias: 'plate idli',    food_id: 'idli',        portion_grams: 120, portion_label: '3 pieces' },
  { alias: 'katori sambar', food_id: 'sambar',      portion_grams: 160, portion_label: '1 katori' },
  { alias: 'katori rajma',  food_id: 'rajma_cooked', portion_grams: 150, portion_label: '1 katori' },
  { alias: 'katori chole',  food_id: 'chole_cooked', portion_grams: 150, portion_label: '1 katori' },
  { alias: 'katori soya',   food_id: 'soya_curry',  portion_grams: 150, portion_label: '1 katori' },
  { alias: 'plate upma',   food_id: 'upma',    portion_grams: 200, portion_label: '1 plate' },
  { alias: 'plate khichdi', food_id: 'khichdi', portion_grams: 250, portion_label: '1 plate' },
  { alias: 'katori upma',  food_id: 'upma',    portion_grams: 150, portion_label: '1 katori' },
  { alias: 'bowl rajma chawal',   food_id: 'rajma_chawal', portion_grams: 300, portion_label: '1 katori' },
  { alias: 'rajma chawal',        food_id: 'rajma_chawal', portion_grams: 300, portion_label: '1 plate' },
  // Regional / colloquial single-word aliases
  { alias: 'chapati',   food_id: 'roti' },
  { alias: 'phulka',    food_id: 'roti' },
  { alias: 'rotis',     food_id: 'roti' },
  { alias: 'chapatis',  food_id: 'roti' },
  { alias: 'chawal',    food_id: 'rice_cooked' },
  { alias: 'bhaat',     food_id: 'rice_cooked' },
  { alias: 'bhat',      food_id: 'rice_cooked' },
  { alias: 'dahi',      food_id: 'curd' },
  { alias: 'yogurt',    food_id: 'curd' },
  { alias: 'doodh',     food_id: 'milk' },
  { alias: 'dudh',      food_id: 'milk' },
  { alias: 'anda',      food_id: 'egg_whole' },
  { alias: 'ande',      food_id: 'egg_whole' },
  { alias: 'eggs',      food_id: 'egg_whole' },
  { alias: 'toor dal',  food_id: 'dal_cooked' },
  { alias: 'arhar dal', food_id: 'dal_cooked' },
  { alias: 'moong',     food_id: 'moong_dal_cooked' },
  { alias: 'mung dal',  food_id: 'moong_dal_cooked' },
  { alias: 'rajmah',    food_id: 'rajma_cooked' },
  { alias: 'chickpea curry', food_id: 'chole_cooked' },
  { alias: 'paneer butter masala', food_id: 'paneer_sabzi' },
  { alias: 'shahi paneer', food_id: 'paneer_sabzi' },
  { alias: 'sabji',     food_id: 'mixed_veg' },
  { alias: 'sabzi',     food_id: 'mixed_veg' },
  { alias: 'dosa',      food_id: 'plain_dosa' },
  { alias: 'idly',      food_id: 'idli' },
  { alias: 'sambhar',   food_id: 'sambar' },
  { alias: 'pohe',      food_id: 'poha' },
  { alias: 'plain tea', food_id: 'plain_tea' },
  
];

// Ambiguous terms: the resolver must NOT silently pick one. It returns all
// plausible candidates and flags the result as low confidence.
export const AMBIGUOUS_TERMS: Record<string, string[]> = {
  dal:    ['dal_cooked', 'dal_makhani', 'moong_dal_cooked', 'masoor_dal_cooked'],
  sabzi:  ['mixed_veg', 'aloo_gobi', 'bhindi_masala', 'palak_paneer'],
  sabji:  ['mixed_veg', 'aloo_gobi', 'bhindi_masala', 'palak_paneer'],
  curry:  ['chicken_curry', 'egg_curry', 'fish_curry', 'paneer_sabzi', 'mutton_curry'],
  rice:   ['rice_cooked', 'brown_rice_cooked', 'jeera_rice'],
};