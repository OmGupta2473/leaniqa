// 34 realistic Indian meals with ground truth (35 counting the m21 split).
// "expected_items" is the canonical target — totals are computed from it
// by the harness, using the same FOODS table.

export interface ExpectedItem {
  canonical: string;   // food id in FOODS
  grams: number;
}

export interface EvalMeal {
  id: string;
  text: string;
  expected_items: ExpectedItem[];
  note?: string;
}

export const EVAL_SET: EvalMeal[] = [
  { id: 'm01', text: '2 roti and 1 katori dal',
    expected_items: [{ canonical: 'roti', grams: 80 }, { canonical: 'dal_cooked', grams: 150 }] },
  { id: 'm02', text: '1 bowl poha',
    expected_items: [{ canonical: 'poha', grams: 150 }] },
  { id: 'm03', text: '2 idli with sambar',
    expected_items: [{ canonical: 'idli', grams: 80 }, { canonical: 'sambar', grams: 160 }] },
  { id: 'm04', text: '1 katori chawal and chicken curry',
    expected_items: [{ canonical: 'rice_cooked', grams: 150 }, { canonical: 'chicken_curry', grams: 150 }] },
  { id: 'm05', text: 'aloo gobi sabzi',
    expected_items: [{ canonical: 'aloo_gobi', grams: 150 }] },
  { id: 'm06', text: 'paneer bhurji with 2 chapati',
    expected_items: [{ canonical: 'paneer_bhurji', grams: 120 }, { canonical: 'roti', grams: 80 }] },
  { id: 'm07', text: '250g cooked soya chunks with 2-3 tbsp oil',
    expected_items: [{ canonical: 'soya_curry', grams: 250 }, { canonical: 'oil', grams: 35 }],
    note: 'Range 2-3 → midpoint 2.5 × 14 = 35g. Marked medium confidence.' },
  { id: 'm08', text: '1 banana',
    expected_items: [{ canonical: 'banana', grams: 120 }] },
  { id: 'm09', text: '1 glass milk',
    expected_items: [{ canonical: 'milk', grams: 240 }] },
  { id: 'm10', text: '2 eggs and toast',
    expected_items: [{ canonical: 'egg_whole', grams: 100 }, { canonical: 'bread_slice', grams: 30 }] },
  { id: 'm11', text: '3 roti with paneer sabzi',
    expected_items: [{ canonical: 'roti', grams: 120 }, { canonical: 'paneer_sabzi', grams: 150 }] },
  { id: 'm12', text: '1 katori rajma chawal',
    expected_items: [{ canonical: 'rajma_chawal', grams: 300 }] },
  { id: 'm13', text: 'masala dosa',
    expected_items: [{ canonical: 'masala_dosa', grams: 150 }] },
  { id: 'm14', text: '1 bowl khichdi',
    expected_items: [{ canonical: 'khichdi', grams: 200 }] },
  { id: 'm15', text: '150g grilled chicken breast',
    expected_items: [{ canonical: 'chicken_breast_grilled', grams: 150 }] },
  { id: 'm16', text: '2 slices bread with butter',
    expected_items: [{ canonical: 'bread_slice', grams: 60 }, { canonical: 'butter', grams: 5 }] },
  { id: 'm17', text: 'bowl curd',
    expected_items: [{ canonical: 'curd', grams: 200 }] },
  { id: 'm18', text: '2 paratha',
    expected_items: [{ canonical: 'paratha', grams: 120 }] },
  { id: 'm19', text: '1 plate chicken biryani',
    expected_items: [{ canonical: 'chicken_biryani', grams: 200 }] },
  { id: 'm20', text: 'dal makhani with naan',
    expected_items: [{ canonical: 'dal_makhani', grams: 150 }, { canonical: 'naan', grams: 90 }] },

  // m21 / m21b: the original "1 cup tea" was ambiguous. Testing both
  // interpretations explicitly, one per meal.
  { id: 'm21', text: '1 cup plain tea',
    expected_items: [{ canonical: 'plain_tea', grams: 240 }],
    note: 'No milk, no sugar. ~2 kcal. Tests the "tea means plain tea" read.' },
  { id: 'm21b', text: '1 cup chai',
    expected_items: [{ canonical: 'chai', grams: 150 }],
    note: 'Chai implies milk + sugar. ~150 kcal. Tests the "tea means chai" read.' },

  { id: 'm22', text: 'mixed vegetable sabzi',
    expected_items: [{ canonical: 'mixed_veg', grams: 150 }] },
  { id: 'm23', text: '100g paneer tikka',
    expected_items: [{ canonical: 'paneer_tikka', grams: 100 }] },
  { id: 'm24', text: '1 glass lassi',
    expected_items: [{ canonical: 'lassi', grams: 240 }] },
  { id: 'm25', text: 'chole with bhature',
    expected_items: [{ canonical: 'chole_cooked', grams: 150 }, { canonical: 'bhatura', grams: 80 }] },
  { id: 'm26', text: '2 samosa',
    expected_items: [{ canonical: 'samosa', grams: 120 }] },
  { id: 'm27', text: '1 plate upma',
    expected_items: [{ canonical: 'upma', grams: 200 }] },
  { id: 'm28', text: 'palak paneer with 2 roti',
    expected_items: [{ canonical: 'palak_paneer', grams: 150 }, { canonical: 'roti', grams: 80 }] },
  { id: 'm29', text: '1 katori egg bhurji',
    expected_items: [{ canonical: 'egg_curry', grams: 150 }] },
  { id: 'm30', text: '1 katori sambar',
    expected_items: [{ canonical: 'sambar', grams: 160 }] },

  // ---------- AMBIGUOUS CASES (must flag, not guess) ----------
  { id: 'a01', text: 'dal',
    expected_items: [],
    note: 'Ambiguous — must return candidates, low confidence.' },
  { id: 'a02', text: 'sabzi',
    expected_items: [],
    note: 'Ambiguous — must return candidates, low confidence.' },
  { id: 'a03', text: 'curry',
    expected_items: [],
    note: 'Ambiguous — must return candidates, low confidence.' },
  { id: 'a04', text: '1 bowl dal',
    expected_items: [],
    note: 'Ambiguous food + portion known. Should flag dal as ambiguous.' },
];

export const NUM_MEALS = EVAL_SET.length;