// Curated food catalog for the spike.
// All values are PER 100g OF THE FOOD AS CONSUMED (cooked, edible portion).
// Sources:
//   - USDA FoodData Central (Foundation Foods + SR Legacy) for generic foods
//   - Indian standard nutrition references (IFCT-derived published values,
//     NIN food exchange lists) for Indian cooked dishes — hand-curated,
//     not redistributed third-party datasets.

export interface Per100g {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
}

export interface FoodRecord {
  id: string;
  canonical_name: string;
  display_name: string;
  aliases: string[];
  category:
    | 'bread' | 'rice' | 'dal' | 'legume' | 'vegetable'
    | 'paneer' | 'nonveg' | 'dairy' | 'snack' | 'fruit'
    | 'oil' | 'egg' | 'beverage' | 'sweet';
  per_100g: Per100g;
  default_portion_grams?: number;
  default_portion_label?: string;
  source: 'curated' | 'usda_foundation' | 'usda_sr_legacy';
  source_rank: number;   // 1 = curated/Indian preferred, 2 = USDA foundation, 3 = USDA SR
  confidence: number;    // 0..1 — how confident we are in the values themselves
}

export const FOODS: FoodRecord[] = [
  // ---------- BREADS ----------
  { id: 'roti', canonical_name: 'roti', display_name: 'Roti / Chapati (whole wheat)', aliases: ['chapati','phulka','rotis','chapatis'], category: 'bread',
    per_100g: { kcal: 297, protein: 11.0, fat: 5.0, carbs: 51.0, fiber: 4.9 },
    default_portion_grams: 40, default_portion_label: '1 piece', source: 'curated', source_rank: 1, confidence: 0.95 },

  { id: 'paratha', canonical_name: 'paratha', display_name: 'Paratha (plain, ghee)', aliases: ['paranthas','parathas','porotta'], category: 'bread',
    per_100g: { kcal: 330, protein: 6.4, fat: 13.0, carbs: 45.4, fiber: 3.0 },
    default_portion_grams: 60, default_portion_label: '1 piece', source: 'curated', source_rank: 1, confidence: 0.85 },

  { id: 'naan', canonical_name: 'naan', display_name: 'Naan', aliases: ['naans'], category: 'bread',
    per_100g: { kcal: 310, protein: 10.2, fat: 5.7, carbs: 55.0, fiber: 2.0 },
    default_portion_grams: 90, default_portion_label: '1 piece', source: 'curated', source_rank: 1, confidence: 0.85 },

  { id: 'bread_slice', canonical_name: 'bread', display_name: 'Bread slice (white)', aliases: ['bread slices','toast'], category: 'bread',
    per_100g: { kcal: 265, protein: 8.5, fat: 3.2, carbs: 49.0, fiber: 2.7 },
    default_portion_grams: 30, default_portion_label: '1 slice', source: 'usda_sr_legacy', source_rank: 3, confidence: 0.95 },

  // ---------- RICE ----------
  { id: 'rice_cooked', canonical_name: 'rice', display_name: 'Rice (white, cooked)', aliases: ['chawal','bhaat','bhat','cooked rice','white rice'], category: 'rice',
    per_100g: { kcal: 130, protein: 2.7, fat: 0.3, carbs: 28.0, fiber: 0.4 },
    default_portion_grams: 150, default_portion_label: '1 katori', source: 'curated', source_rank: 1, confidence: 0.95 },

  { id: 'brown_rice_cooked', canonical_name: 'brown rice', display_name: 'Brown rice (cooked)', aliases: ['brown chawal'], category: 'rice',
    per_100g: { kcal: 123, protein: 2.7, fat: 1.0, carbs: 25.6, fiber: 1.6 },
    default_portion_grams: 150, default_portion_label: '1 katori', source: 'usda_foundation', source_rank: 2, confidence: 0.9 },

  { id: 'jeera_rice', canonical_name: 'jeera rice', display_name: 'Jeera Rice', aliases: ['cumin rice'], category: 'rice',
    per_100g: { kcal: 165, protein: 3.0, fat: 4.5, carbs: 28.0, fiber: 0.5 },
    default_portion_grams: 150, default_portion_label: '1 katori', source: 'curated', source_rank: 1, confidence: 0.85 },

  { id: 'khichdi', canonical_name: 'khichdi', display_name: 'Khichdi', aliases: ['khichri','khichuri'], category: 'rice',
    per_100g: { kcal: 115, protein: 5.5, fat: 2.5, carbs: 20.5, fiber: 2.5 },
    default_portion_grams: 200, default_portion_label: '1 bowl', source: 'curated', source_rank: 1, confidence: 0.9 },

  { id: 'poha', canonical_name: 'poha', display_name: 'Poha (flattened rice)', aliases: ['pohe','pohe'], category: 'rice',
    per_100g: { kcal: 130, protein: 3.0, fat: 3.0, carbs: 22.0, fiber: 1.3 },
    default_portion_grams: 150, default_portion_label: '1 bowl', source: 'curated', source_rank: 1, confidence: 0.9 },

  { id: 'upma', canonical_name: 'upma', display_name: 'Upma (semolina)', aliases: ['uppma','uppitu'], category: 'rice',
    per_100g: { kcal: 130, protein: 3.3, fat: 4.7, carbs: 18.7, fiber: 1.3 },
    default_portion_grams: 150, default_portion_label: '1 bowl', source: 'curated', source_rank: 1, confidence: 0.9 },

  { id: 'idli', canonical_name: 'idli', display_name: 'Idli', aliases: ['idly','iddli','idlis'], category: 'rice',
    per_100g: { kcal: 130, protein: 3.8, fat: 0.8, carbs: 24.0, fiber: 1.0 },
    default_portion_grams: 40, default_portion_label: '1 piece', source: 'curated', source_rank: 1, confidence: 0.95 },

  { id: 'plain_dosa', canonical_name: 'plain dosa', display_name: 'Dosa (plain)', aliases: ['dosa','dosai'], category: 'rice',
    per_100g: { kcal: 130, protein: 3.0, fat: 4.0, carbs: 20.0, fiber: 2.0 },
    default_portion_grams: 100, default_portion_label: '1 piece', source: 'curated', source_rank: 1, confidence: 0.9 },

  { id: 'masala_dosa', canonical_name: 'masala dosa', display_name: 'Masala Dosa', aliases: ['masala dosai'], category: 'rice',
    per_100g: { kcal: 190, protein: 3.5, fat: 8.0, carbs: 25.0, fiber: 2.5 },
    default_portion_grams: 150, default_portion_label: '1 piece', source: 'curated', source_rank: 1, confidence: 0.85 },

  // ---------- DALS & LEGUMES ----------
  { id: 'dal_cooked', canonical_name: 'dal', display_name: 'Dal (toor/arhar, cooked)', aliases: ['daal','dhal','toor dal','arhar dal'], category: 'dal',
    per_100g: { kcal: 116, protein: 7.2, fat: 0.5, carbs: 20.9, fiber: 5.1 },
    default_portion_grams: 150, default_portion_label: '1 katori', source: 'curated', source_rank: 1, confidence: 0.85 },

  { id: 'dal_makhani', canonical_name: 'dal makhani', display_name: 'Dal Makhani', aliases: ['makhani dal'], category: 'dal',
    per_100g: { kcal: 140, protein: 6.0, fat: 7.0, carbs: 15.0, fiber: 4.0 },
    default_portion_grams: 150, default_portion_label: '1 katori', source: 'curated', source_rank: 1, confidence: 0.85 },

  { id: 'moong_dal_cooked', canonical_name: 'moong dal', display_name: 'Moong Dal (cooked)', aliases: ['mung dal','green gram dal'], category: 'dal',
    per_100g: { kcal: 105, protein: 7.6, fat: 0.7, carbs: 19.0, fiber: 4.1 },
    default_portion_grams: 150, default_portion_label: '1 katori', source: 'curated', source_rank: 1, confidence: 0.9 },

  { id: 'masoor_dal_cooked', canonical_name: 'masoor dal', display_name: 'Masoor Dal (cooked)', aliases: ['red lentil dal'], category: 'dal',
    per_100g: { kcal: 116, protein: 9.0, fat: 0.4, carbs: 20.1, fiber: 4.9 },
    default_portion_grams: 150, default_portion_label: '1 katori', source: 'curated', source_rank: 1, confidence: 0.9 },

  { id: 'rajma_cooked', canonical_name: 'rajma', display_name: 'Rajma (kidney beans, cooked)', aliases: ['rajmah','kidney beans'], category: 'legume',
    per_100g: { kcal: 127, protein: 8.7, fat: 0.5, carbs: 22.8, fiber: 6.4 },
    default_portion_grams: 150, default_portion_label: '1 katori', source: 'curated', source_rank: 1, confidence: 0.9 },

  { id: 'rajma_chawal', canonical_name: 'rajma chawal', display_name: 'Rajma Chawal', aliases: ['rajma rice','rajmah chawal'], category: 'legume',
    per_100g: { kcal: 128, protein: 5.7, fat: 0.4, carbs: 25.4, fiber: 3.4 },
    default_portion_grams: 150, default_portion_label: '1 katori', source: 'curated', source_rank: 1, confidence: 0.8 },

  { id: 'chole_cooked', canonical_name: 'chole', display_name: 'Chole (chickpeas, cooked)', aliases: ['chana masala','chickpea curry','cholay'], category: 'legume',
    per_100g: { kcal: 164, protein: 8.9, fat: 2.6, carbs: 27.4, fiber: 7.6 },
    default_portion_grams: 150, default_portion_label: '1 katori', source: 'curated', source_rank: 1, confidence: 0.9 },

  { id: 'sambar', canonical_name: 'sambar', display_name: 'Sambar', aliases: ['sambhar','sambhars'], category: 'dal',
    per_100g: { kcal: 81, protein: 4.0, fat: 2.1, carbs: 12.0, fiber: 2.5 },
    default_portion_grams: 160, default_portion_label: '1 katori', source: 'curated', source_rank: 1, confidence: 0.9 },

  { id: 'soya_curry', canonical_name: 'soya chunks curry', display_name: 'Soya Chunks Curry (cooked)', aliases: ['soya chunks','soya sabzi','meal maker'], category: 'legume',
    per_100g: { kcal: 180, protein: 22.0, fat: 6.0, carbs: 10.0, fiber: 4.0 },
    default_portion_grams: 150, default_portion_label: '1 bowl', source: 'curated', source_rank: 1, confidence: 0.85 },

  { id: 'sprouts', canonical_name: 'sprouts', display_name: 'Sprouts (moong, raw)', aliases: ['sprouted moong','ankurit'], category: 'legume',
    per_100g: { kcal: 30, protein: 3.8, fat: 0.2, carbs: 6.0, fiber: 1.8 },
    default_portion_grams: 100, default_portion_label: '1 bowl', source: 'curated', source_rank: 1, confidence: 0.9 },

  // ---------- VEGETABLES (cooked sabzi) ----------
  { id: 'aloo_gobi', canonical_name: 'aloo gobi', display_name: 'Aloo Gobi', aliases: ['aloo gobhi','potato cauliflower'], category: 'vegetable',
    per_100g: { kcal: 121, protein: 2.2, fat: 5.4, carbs: 16.0, fiber: 2.2 },
    default_portion_grams: 150, default_portion_label: '1 katori', source: 'curated', source_rank: 1, confidence: 0.85 },

  { id: 'bhindi_masala', canonical_name: 'bhindi', display_name: 'Bhindi Masala (okra)', aliases: ['okra','lady finger','bhindi masala'], category: 'vegetable',
    per_100g: { kcal: 161, protein: 3.9, fat: 10.7, carbs: 12.1, fiber: 2.5 },
    default_portion_grams: 130, default_portion_label: '1 katori', source: 'curated', source_rank: 1, confidence: 0.85 },

  { id: 'mixed_veg', canonical_name: 'mixed vegetable', display_name: 'Mixed Vegetable Sabzi', aliases: ['sabzi','sabji','mixed veg','veg curry'], category: 'vegetable',
    per_100g: { kcal: 103, protein: 1.3, fat: 4.7, carbs: 12.3, fiber: 3.0 },
    default_portion_grams: 150, default_portion_label: '1 katori', source: 'curated', source_rank: 1, confidence: 0.7 },

  { id: 'palak_paneer', canonical_name: 'palak paneer', display_name: 'Palak Paneer', aliases: ['spinach paneer'], category: 'paneer',
    per_100g: { kcal: 180, protein: 9.0, fat: 12.0, carbs: 8.0, fiber: 2.5 },
    default_portion_grams: 150, default_portion_label: '1 katori', source: 'curated', source_rank: 1, confidence: 0.85 },

  { id: 'mutter_paneer', canonical_name: 'mutter paneer', display_name: 'Mutter Paneer', aliases: ['matar paneer','peas paneer'], category: 'paneer',
    per_100g: { kcal: 147, protein: 8.5, fat: 8.1, carbs: 10.7, fiber: 2.5 },
    default_portion_grams: 150, default_portion_label: '1 katori', source: 'curated', source_rank: 1, confidence: 0.85 },

  { id: 'paneer_sabzi', canonical_name: 'paneer sabzi', display_name: 'Paneer Sabzi', aliases: ['paneer curry','paneer sabji'], category: 'paneer',
    per_100g: { kcal: 210, protein: 12.0, fat: 16.0, carbs: 5.0, fiber: 1.5 },
    default_portion_grams: 150, default_portion_label: '1 katori', source: 'curated', source_rank: 1, confidence: 0.8 },

  { id: 'paneer_bhurji', canonical_name: 'paneer bhurji', display_name: 'Paneer Bhurji', aliases: ['bhurji paneer'], category: 'paneer',
    per_100g: { kcal: 220, protein: 12.0, fat: 17.0, carbs: 4.0, fiber: 1.0 },
    default_portion_grams: 120, default_portion_label: '1 katori', source: 'curated', source_rank: 1, confidence: 0.85 },

  { id: 'paneer_tikka', canonical_name: 'paneer tikka', display_name: 'Paneer Tikka', aliases: [], category: 'paneer',
    per_100g: { kcal: 220, protein: 12.0, fat: 15.0, carbs: 4.0, fiber: 1.0 },
    default_portion_grams: 35, default_portion_label: '1 piece', source: 'curated', source_rank: 1, confidence: 0.85 },

  { id: 'bhatura', canonical_name: 'bhatura', display_name: 'Bhatura', aliases: ['bhature','bhaturas','bature'], category: 'bread',
    per_100g: { kcal: 380, protein: 7.0, fat: 15.0, carbs: 52.0, fiber: 3.0 },
    default_portion_grams: 80, default_portion_label: '1 piece', source: 'curated', source_rank: 1, confidence: 0.85 },
  // ---------- NON-VEG ----------
  { id: 'chicken_curry', canonical_name: 'chicken curry', display_name: 'Chicken Curry', aliases: ['murgh curry','chicken gravy'], category: 'nonveg',
    per_100g: { kcal: 140, protein: 14.0, fat: 8.0, carbs: 3.0, fiber: 0.5 },
    default_portion_grams: 150, default_portion_label: '1 katori', source: 'curated', source_rank: 1, confidence: 0.85 },

  { id: 'butter_chicken', canonical_name: 'butter chicken', display_name: 'Butter Chicken', aliases: ['murgh makhani'], category: 'nonveg',
    per_100g: { kcal: 190, protein: 13.0, fat: 13.0, carbs: 6.0, fiber: 0.5 },
    default_portion_grams: 200, default_portion_label: '1 bowl', source: 'curated', source_rank: 1, confidence: 0.85 },

  { id: 'chicken_tikka', canonical_name: 'chicken tikka', display_name: 'Chicken Tikka', aliases: ['tandoori chicken tikka'], category: 'nonveg',
    per_100g: { kcal: 165, protein: 25.0, fat: 7.0, carbs: 1.0, fiber: 0.0 },
    default_portion_grams: 90, default_portion_label: '1 piece', source: 'curated', source_rank: 1, confidence: 0.85 },

  { id: 'chicken_biryani', canonical_name: 'chicken biryani', display_name: 'Chicken Biryani', aliases: ['biryani','murgh biryani'], category: 'nonveg',
    per_100g: { kcal: 163, protein: 9.2, fat: 5.1, carbs: 20.1, fiber: 1.0 },
    default_portion_grams: 200, default_portion_label: '1 bowl', source: 'curated', source_rank: 1, confidence: 0.85 },

  { id: 'mutton_curry', canonical_name: 'mutton curry', display_name: 'Mutton Curry', aliases: ['goat curry','lamb curry'], category: 'nonveg',
    per_100g: { kcal: 200, protein: 15.0, fat: 14.0, carbs: 4.0, fiber: 0.5 },
    default_portion_grams: 150, default_portion_label: '1 katori', source: 'curated', source_rank: 1, confidence: 0.8 },

  { id: 'fish_curry', canonical_name: 'fish curry', display_name: 'Fish Curry', aliases: ['machli curry'], category: 'nonveg',
    per_100g: { kcal: 100, protein: 12.0, fat: 4.0, carbs: 3.0, fiber: 0.5 },
    default_portion_grams: 150, default_portion_label: '1 katori', source: 'curated', source_rank: 1, confidence: 0.8 },

  { id: 'egg_curry', canonical_name: 'egg curry', display_name: 'Egg Curry', aliases: ['anda curry','egg bhurji'], category: 'nonveg',
    per_100g: { kcal: 120, protein: 8.0, fat: 8.0, carbs: 4.0, fiber: 0.5 },
    default_portion_grams: 150, default_portion_label: '1 katori', source: 'curated', source_rank: 1, confidence: 0.85 },

  { id: 'chicken_breast_grilled', canonical_name: 'chicken breast', display_name: 'Chicken Breast (grilled)', aliases: ['grilled chicken','chicken breast grilled'], category: 'nonveg',
    per_100g: { kcal: 165, protein: 31.0, fat: 3.6, carbs: 0.0, fiber: 0.0 },
    default_portion_grams: 100, default_portion_label: '100g', source: 'usda_sr_legacy', source_rank: 3, confidence: 0.95 },

  // ---------- DAIRY ----------
  { id: 'paneer', canonical_name: 'paneer', display_name: 'Paneer (raw)', aliases: ['cottage cheese'], category: 'paneer',
    per_100g: { kcal: 265, protein: 18.3, fat: 20.8, carbs: 1.2, fiber: 0.0 },
    default_portion_grams: 30, default_portion_label: '1 piece', source: 'curated', source_rank: 1, confidence: 0.95 },

  { id: 'curd', canonical_name: 'curd', display_name: 'Curd / Dahi', aliases: ['dahi','yogurt','yoghurt','thayir'], category: 'dairy',
    per_100g: { kcal: 60, protein: 3.5, fat: 3.3, carbs: 4.7, fiber: 0.0 },
    default_portion_grams: 200, default_portion_label: '1 katori', source: 'curated', source_rank: 1, confidence: 0.95 },

  { id: 'milk', canonical_name: 'milk', display_name: 'Milk (full fat)', aliases: ['doodh','dudh','whole milk'], category: 'dairy',
    per_100g: { kcal: 65, protein: 3.2, fat: 3.7, carbs: 4.7, fiber: 0.0 },
    default_portion_grams: 240, default_portion_label: '1 glass', source: 'usda_sr_legacy', source_rank: 3, confidence: 0.95 },

  { id: 'lassi', canonical_name: 'lassi', display_name: 'Lassi (sweet)', aliases: ['sweet lassi'], category: 'dairy',
    per_100g: { kcal: 70, protein: 2.5, fat: 2.0, carbs: 10.0, fiber: 0.0 },
    default_portion_grams: 240, default_portion_label: '1 glass', source: 'curated', source_rank: 1, confidence: 0.85 },

  { id: 'ghee', canonical_name: 'ghee', display_name: 'Ghee', aliases: ['clarified butter'], category: 'oil',
    per_100g: { kcal: 900, protein: 0.3, fat: 99.5, carbs: 0.0, fiber: 0.0 },
    default_portion_grams: 5, default_portion_label: '1 tsp', source: 'curated', source_rank: 1, confidence: 0.95 },

  { id: 'oil', canonical_name: 'oil', display_name: 'Cooking Oil', aliases: ['vegetable oil','sunflower oil','mustard oil'], category: 'oil',
    per_100g: { kcal: 884, protein: 0.0, fat: 100.0, carbs: 0.0, fiber: 0.0 },
    default_portion_grams: 14, default_portion_label: '1 tbsp', source: 'usda_sr_legacy', source_rank: 3, confidence: 0.95 },

  { id: 'butter', canonical_name: 'butter', display_name: 'Butter', aliases: ['makhan'], category: 'oil',
    per_100g: { kcal: 720, protein: 0.5, fat: 80.0, carbs: 0.5, fiber: 0.0 },
    default_portion_grams: 5, default_portion_label: '1 tsp', source: 'usda_sr_legacy', source_rank: 3, confidence: 0.95 },

  // ---------- EGGS ----------
  { id: 'egg_whole', canonical_name: 'egg', display_name: 'Egg (whole, boiled)', aliases: ['eggs','anda','ande','boiled egg'], category: 'egg',
    per_100g: { kcal: 155, protein: 13.0, fat: 11.0, carbs: 1.1, fiber: 0.0 },
    default_portion_grams: 50, default_portion_label: '1 large', source: 'usda_sr_legacy', source_rank: 3, confidence: 0.95 },

  // ---------- SNACKS ----------
  { id: 'samosa', canonical_name: 'samosa', display_name: 'Samosa', aliases: ['samosas','singara'], category: 'snack',
    per_100g: { kcal: 308, protein: 4.5, fat: 17.0, carbs: 32.0, fiber: 2.0 },
    default_portion_grams: 60, default_portion_label: '1 piece', source: 'curated', source_rank: 1, confidence: 0.85 },

  { id: 'dhokla', canonical_name: 'dhokla', display_name: 'Dhokla', aliases: ['khaman','dhoklas'], category: 'snack',
    per_100g: { kcal: 160, protein: 5.0, fat: 3.0, carbs: 28.0, fiber: 1.5 },
    default_portion_grams: 30, default_portion_label: '1 piece', source: 'curated', source_rank: 1, confidence: 0.85 },

  // ---------- FRUITS ----------
  { id: 'banana', canonical_name: 'banana', display_name: 'Banana', aliases: ['kela','kelas'], category: 'fruit',
    per_100g: { kcal: 89, protein: 1.1, fat: 0.3, carbs: 23.0, fiber: 2.6 },
    default_portion_grams: 120, default_portion_label: '1 medium', source: 'usda_sr_legacy', source_rank: 3, confidence: 0.95 },

  { id: 'apple', canonical_name: 'apple', display_name: 'Apple', aliases: ['seb'], category: 'fruit',
    per_100g: { kcal: 52, protein: 0.3, fat: 0.2, carbs: 14.0, fiber: 2.4 },
    default_portion_grams: 180, default_portion_label: '1 medium', source: 'usda_sr_legacy', source_rank: 3, confidence: 0.95 },

  // ---------- BEVERAGES ----------
   { id: 'plain_tea', canonical_name: 'plain tea', display_name: 'Plain Tea (no milk, no sugar)', aliases: ['black tea'], category: 'beverage',
    per_100g: { kcal: 1, protein: 0.0, fat: 0.0, carbs: 0.2, fiber: 0.0 },
    default_portion_grams: 240, default_portion_label: '1 cup', source: 'curated', source_rank: 1, confidence: 0.9 },
  
  { id: 'chai', canonical_name: 'chai', display_name: 'Chai (with milk + sugar)', aliases: ['tea','chai latte'], category: 'beverage',
    per_100g: { kcal: 100, protein: 2.0, fat: 3.0, carbs: 15.0, fiber: 0.0 },
    default_portion_grams: 150, default_portion_label: '1 cup', source: 'curated', source_rank: 1, confidence: 0.8 },

  { id: 'coffee', canonical_name: 'coffee', display_name: 'Coffee (with milk)', aliases: ['kaapi','filter coffee'], category: 'beverage',
    per_100g: { kcal: 60, protein: 2.0, fat: 2.0, carbs: 8.0, fiber: 0.0 },
    default_portion_grams: 150, default_portion_label: '1 cup', source: 'curated', source_rank: 1, confidence: 0.8 },
];

export function findFood(idOrCanonical: string): FoodRecord | undefined {
  const needle = idOrCanonical.toLowerCase();
  return FOODS.find((f) => f.id === needle || f.canonical_name === needle);
}