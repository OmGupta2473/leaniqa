// Phase 6.7 — Eval set v2 for AI-first + KB architecture.
// Parallel to eval-set.ts (v1); does not overwrite it.
//
// Every deterministic case is asserted against a concrete staging food_id
// (Q6 decision). The 6 intentionally-fuzzy cases are:
//   - a01, a02, a03, a04 (bare ambiguous terms)
//   - d01 (bare "2 bowl dal")
//   - m07 (soya chunks — only "soya chunks curry" exists; closest match)
//   - m12 (rajma chawal katori portion — no katori row)
//   - m27 (upma "plate" — no plate row; wide band)
//   - n02 (ghee tbsp — no tbsp portion row; wide band)
//
// Tolerance rules (enforced by run-v1 / run-v2, not by this file):
//   - grams_exact: ±5% OR ±5g, whichever is larger.
//   - grams_min / grams_max: inclusive band.
//   - grams_any: any grams > 0.
//   - Aggregate kcal: ±10% of expected total.
//   - Aggregate protein: ±3g of expected total.
//   - Unresolved items: forbidden whenever expected_items is non-empty.

export interface ExpectedItemV2 {
  food_id?: number;
  category?: string;
  canonical_contains?: string;
  grams_exact?: number;
  grams_min?: number;
  grams_max?: number;
  grams_any?: true;
  note?: string;
}

export interface EvalMealV2 {
  id: string;
  text: string;
  expected_items: ExpectedItemV2[];
  expect_was_ambiguous?: boolean;
  note?: string;
}

export const EVAL_SET_V2: EvalMealV2[] = [
  // ==========================================================================
  // PART 1 — Preserved from v1, resolved to food_id
  // ==========================================================================

  { id: 'm01', text: '2 roti and 1 katori dal',
    expected_items: [
      { food_id: 5, grams_exact: 80, note: '2 × 40g' },
      { category: 'dal', grams_exact: 100, note: '1 katori; type ambiguous' },
    ],
    expect_was_ambiguous: true },

  { id: 'm02', text: '1 bowl poha',
    expected_items: [{ food_id: 27, grams_exact: 150, note: 'poha (rice category); bowl=150g' }] },

  { id: 'm03', text: '2 idli with sambar',
    expected_items: [
      { food_id: 29, grams_exact: 80, note: '2 × 40g piece' },
      { food_id: 46, grams_exact: 160, note: '1 bowl sambar' },
    ] },

  { id: 'm04', text: '1 katori chawal and chicken curry',
    expected_items: [
      { food_id: 18, grams_exact: 100, note: 'rice; katori=100g' },
      { food_id: 75, grams_exact: 150, note: 'bowl=150g' },
    ] },

  { id: 'm05', text: 'aloo gobi sabzi',
    expected_items: [{ food_id: 50, grams_exact: 150, note: 'bowl=150g' }] },

  { id: 'm06', text: 'paneer bhurji with 2 chapati',
    expected_items: [
      { food_id: 69, grams_exact: 120, note: 'paneer bhurji; bowl=120g' },
      { food_id: 5, grams_exact: 80, note: 'chapati → roti; 2 × 40g' },
    ] },

  { id: 'm07', text: '250g cooked soya chunks with 2-3 tbsp oil',
    expected_items: [
      { food_id: 49, grams_exact: 250, note: 'soya chunks curry; closest DB row (no plain chunks)' },
      { food_id: 97, grams_exact: 35, note: 'oil; 2.5 tbsp midpoint × 14g' },
    ] },

  { id: 'm08', text: '1 banana',
    expected_items: [{ food_id: 116, grams_exact: 120, note: 'piece=120g' }] },

  { id: 'm09', text: '1 glass milk',
    expected_items: [{ food_id: 91, grams_exact: 240, note: 'glass=240g' }] },

  { id: 'm10', text: '2 eggs and toast',
    expected_items: [
      { food_id: 87, grams_exact: 100, note: '2 × 50g' },
      { food_id: 16, grams_exact: 30, note: 'toast → bread slice; 1 slice=30g' },
    ] },

  { id: 'm11', text: '3 roti with paneer sabzi',
    expected_items: [
      { food_id: 5, grams_exact: 120, note: '3 × 40g' },
      { food_id: 70, grams_exact: 150, note: 'bowl=150g' },
    ] },

  { id: 'm12', text: '1 katori rajma chawal',
    expected_items: [
      { food_id: 142, grams_min: 100, grams_max: 300,
        note: 'rajma chawal (legume); no katori portion row — wide band' },
    ] },

  { id: 'm13', text: 'masala dosa',
    expected_items: [{ food_id: 31, grams_exact: 150, note: 'rice category; piece=150g' }] },

  { id: 'm14', text: '1 bowl khichdi',
    expected_items: [{ food_id: 24, grams_exact: 200, note: 'bowl=200g' }] },

  { id: 'm15', text: '150g grilled chicken breast',
    expected_items: [{ food_id: 80, grams_exact: 150, note: 'explicit 150g overrides 100g default' }] },

  { id: 'm16', text: '2 slices bread with butter',
    expected_items: [
      { food_id: 16, grams_exact: 60, note: '2 × 30g slice' },
      { food_id: 96, grams_exact: 5, note: 'butter; default tsp=5g' },
    ] },

  { id: 'm17', text: 'bowl curd',
    expected_items: [{ food_id: 90, grams_exact: 200, note: 'bowl=200g' }] },

  { id: 'm18', text: '2 paratha',
    expected_items: [{ food_id: 6, grams_exact: 120, note: '2 × 60g piece' }] },

  { id: 'm19', text: '1 plate chicken biryani',
    expected_items: [{ food_id: 22, grams_exact: 200, note: 'plate ↔ bowl; bowl=200g' }] },

  { id: 'm20', text: 'dal makhani with naan',
    expected_items: [
      { food_id: 35, grams_exact: 150, note: 'bowl=150g' },
      { food_id: 9, grams_exact: 90, note: 'piece=90g' },
    ] },

  { id: 'm21', text: '1 cup plain tea',
    expected_items: [{ food_id: 133, grams_exact: 240, note: 'plain tea; cup=240g' }] },

  { id: 'm21b', text: '1 cup chai',
    expected_items: [{ food_id: 132, grams_exact: 150, note: 'chai; cup=150g' }] },

  { id: 'm22', text: 'mixed vegetable sabzi',
    expected_items: [{ food_id: 64, grams_exact: 150, note: 'mixed vegetable; bowl=150g' }] },

  { id: 'm23', text: '100g paneer tikka',
    expected_items: [{ food_id: 71, grams_exact: 100, note: 'explicit 100g overrides 35g piece default' }] },

  { id: 'm24', text: '1 glass lassi',
    expected_items: [{ food_id: 99, grams_exact: 240, note: 'sweet lassi; only lassi variant in DB; glass=240g' }] },

  { id: 'm25', text: 'chole with bhature',
    expected_items: [
      { food_id: 43, grams_exact: 150, note: 'chole; bowl=150g' },
      { food_id: 12, grams_exact: 80, note: 'bhatura; piece=80g' },
    ] },

  { id: 'm26', text: '2 samosa',
    expected_items: [{ food_id: 102, grams_exact: 120, note: '2 × 60g piece' }] },

  { id: 'm27', text: '1 plate upma',
    expected_items: [
      { food_id: 28, grams_min: 150, grams_max: 250,
        note: 'upma (rice); bowl=150g, "plate" suggests larger — wide band' },
    ] },

  { id: 'm28', text: 'palak paneer with 2 roti',
    expected_items: [
      { food_id: 67, grams_exact: 150, note: 'bowl=150g' },
      { food_id: 5, grams_exact: 80, note: '2 × 40g' },
    ] },

  { id: 'm29', text: '1 katori egg bhurji',
    expected_items: [{ food_id: 89, grams_exact: 100,
                        note: 'egg bhurji; no katori row — AI likely ~100g vs 120g bowl default' }] },

  { id: 'm30', text: '1 katori sambar',
    expected_items: [{ food_id: 46, grams_exact: 100,
                        note: 'sambar; no katori row — AI likely ~100g vs 160g bowl default' }] },

  // ==========================================================================
  // PART 2 — Ambiguous cases (Option B: resolve + flag)
  // ==========================================================================

  { id: 'a01', text: 'dal',
    expected_items: [{ category: 'dal', grams_any: true }],
    expect_was_ambiguous: true,
    note: 'Bare dal: AI resolves to some dal; was_ambiguous must be true.' },

  { id: 'a02', text: 'sabzi',
    expected_items: [{ category: 'vegetable', grams_any: true }],
    expect_was_ambiguous: true,
    note: 'Bare sabzi: AI resolves to some vegetable dish.' },

  { id: 'a03', text: 'curry',
    expected_items: [{ canonical_contains: 'curry', grams_any: true }],
    expect_was_ambiguous: true,
    note: 'Bare curry: curries span multiple categories — assert canonical name contains "curry".' },

  { id: 'a04', text: '1 bowl dal',
    expected_items: [{ category: 'dal', grams_exact: 150 }],
    expect_was_ambiguous: true,
    note: 'Quantity known, type still ambiguous.' },

  // ==========================================================================
  // PART 3 — Dal coverage
  // ==========================================================================

  { id: 'd01', text: '2 bowl dal',
    expected_items: [{ category: 'dal', grams_exact: 300 }],
    expect_was_ambiguous: true,
    note: 'Explicit quantity, ambiguous type.' },

  { id: 'd02', text: '1 bowl toor dal',
    expected_items: [{ food_id: 34, grams_exact: 150,
                        note: 'toor dal → generic "dal" (id 34, toor/arhar). Not ambiguous.' }] },

  { id: 'd03', text: '1 bowl chana dal',
    expected_items: [{ food_id: 41, grams_exact: 150 }] },

  { id: 'd04', text: '1 bowl cooked toor dal with 1 tsp ghee',
    expected_items: [
      { food_id: 34, grams_exact: 150, note: 'prep-strip "cooked"; toor dal → dal(34)' },
      { food_id: 95, grams_exact: 5, note: 'ghee; 1 tsp=5g' },
    ] },

  // ==========================================================================
  // PART 4 — Rice, roti, sabzi
  // ==========================================================================

  { id: 'r01', text: '2 bowl rice',
    expected_items: [{ food_id: 18, grams_exact: 300, note: '2 × 150g' }] },

  { id: 'r02', text: '1 katori rice',
    expected_items: [{ food_id: 18, grams_exact: 100, note: 'katori=100g' }] },

  { id: 'r03', text: '50g rice',
    expected_items: [{ food_id: 18, grams_exact: 50, note: 'explicit grams override' }] },

  { id: 'rt01', text: '3 roti',
    expected_items: [{ food_id: 5, grams_exact: 120, note: '3 × 40g' }] },

  { id: 'rt02', text: '2 chapati',
    expected_items: [{ food_id: 5, grams_exact: 80, note: 'chapati → roti; 2 × 40g' }] },

  { id: 'rt04', text: '2 paratha with curd',
    expected_items: [
      { food_id: 6, grams_exact: 120, note: '2 × 60g' },
      { food_id: 90, grams_exact: 200, note: 'bowl=200g' },
    ] },

  { id: 's01', text: '1 bowl aloo gobi',
    expected_items: [{ food_id: 50, grams_exact: 150, note: 'bowl=150g' }] },

  { id: 's02', text: '2 katori mixed veg',
    expected_items: [{ food_id: 64, grams_exact: 200, note: '2 × 100g katori' }] },

  // ==========================================================================
  // PART 5 — Curry, paneer, chicken
  // ==========================================================================

  { id: 'c01', text: '1 bowl chicken curry',
    expected_items: [{ food_id: 75, grams_exact: 150, note: 'bowl=150g' }] },

  { id: 'c02', text: '1 katori dal fry',
    expected_items: [{ food_id: 37, grams_exact: 100,
                        note: 'dal fry; no katori row — AI likely ~100g vs 150g bowl default' }] },

  { id: 'p01', text: '150g paneer bhurji',
    expected_items: [{ food_id: 69, grams_exact: 150, note: 'explicit 150g overrides 120g bowl' }] },

  { id: 'p02', text: '2 piece paneer tikka',
    expected_items: [{ food_id: 71, grams_exact: 70, note: '2 × 35g piece' }] },

  { id: 'ck01', text: '150g chicken tikka',
    expected_items: [{ food_id: 77, grams_exact: 150, note: 'explicit 150g overrides 90g piece' }] },

  { id: 'ck02', text: '2 piece tandoori chicken',
    expected_items: [{ food_id: 79, grams_exact: 180, note: '2 × 90g piece' }] },

  // ==========================================================================
  // PART 6 — Egg, dairy, beverage
  // ==========================================================================

  { id: 'e01', text: '3 boiled eggs',
    expected_items: [{ food_id: 87, grams_exact: 150, note: 'prep-strip "boiled"; 3 × 50g' }] },

  { id: 'cm01', text: '2 katori curd',
    expected_items: [{ food_id: 90, grams_exact: 200, note: '2 × 100g katori' }] },

  { id: 'cm02', text: '1 glass toned milk',
    expected_items: [{ food_id: 92, grams_exact: 240, note: 'glass=240g' }] },

  { id: 'cm03', text: '200ml milk',
    expected_items: [{ food_id: 91, grams_exact: 200, note: 'explicit ml overrides 240g glass default' }] },

  { id: 't01', text: '2 cup chai',
    expected_items: [{ food_id: 132, grams_exact: 300, note: '2 × 150g' }] },

  { id: 't02', text: 'masala chai',
    expected_items: [{ food_id: 132, grams_any: true,
                        note: 'masala chai → chai (id 132); no quantity, AI estimates' }] },

  // ==========================================================================
  // PART 7 — Fruit, nuts, oil
  // ==========================================================================

  { id: 'n01', text: '10 almonds',
    expected_items: [{ food_id: 126, grams_exact: 12, note: '10 × 1.2g piece' }] },

  { id: 'n02', text: '1 tbsp ghee',
    expected_items: [{ food_id: 95, grams_min: 10, grams_max: 20,
                        note: 'ghee; tsp=5g in DB, no tbsp row — wide band for 1 tbsp (~14g)' }] },

  // ==========================================================================
  // PART 8 — Preparation-word coverage
  // ==========================================================================

  { id: 'prep01', text: '2 boiled eggs',
    expected_items: [{ food_id: 87, grams_exact: 100, note: 'prep-strip "boiled"; 2 × 50g' }] },

  { id: 'prep02', text: '1 bowl steamed rice',
    expected_items: [{ food_id: 18, grams_exact: 150, note: 'prep-strip "steamed"; bowl=150g' }] },
];

export const NUM_MEALS_V2 = EVAL_SET_V2.length;