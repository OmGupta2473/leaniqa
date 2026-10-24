/**
 * Phase 6.7 R2.3 — smoke tests for foodResolverV2.
 *
 * Not a full test suite — targeted regression tests for the fixes R2.3
 * introduces: katori via food_portions, prep-strip, memory re-flagging,
 * memory write policy.
 */

import { describe, it, expect } from 'vitest';
import {
  resolve,
  normalizeInput,
  DEFAULT_RESOLVER_CONFIG,
  type ResolverDb,
  type ResolverConfig,
  type FoodRow,
  type AliasRow,
  type AmbiguousCandidate,
  type ScoredAlias,
  type ScoredFood,
  type MealMemoryRow,
  type PopularMealRow,
  type MemoryWrite,
  type ResolvedItem,
} from '../foodResolverV2';
import type { FoodPortionRow } from '../portionLookup';

const TEST_USER = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

function makeFood(
  overrides: Partial<FoodRow> & { id: number; canonical_name: string },
): FoodRow {
  return {
    source: 'curated',
    source_id: `curated:${overrides.canonical_name}`,
    source_rank: 0,
    display_name: overrides.canonical_name,
    search_name: overrides.canonical_name,
    category: 'dal',
    kcal_per_100g: 100,
    protein_per_100g: 10,
    fat_per_100g: 1,
    carbs_per_100g: 15,
    fiber_per_100g: 2,
    default_portion_grams: null,
    default_portion_label: null,
    is_ambiguous: false,
    oil_included: false,
    oil_per_100g: null,
    provenance: null,
    review_status: 'provisional',
    ...overrides,
  };
}

class FakeDb implements ResolverDb {
  foods = new Map<number, FoodRow>();
  aliases = new Map<string, AliasRow>();
  ambiguity = new Map<string, AmbiguousCandidate[]>();
  portions = new Map<number, FoodPortionRow[]>();
  memory = new Map<string, MealMemoryRow>();
  memoryWrites: MemoryWrite[] = [];

  async getFoodByCanonicalName(name: string): Promise<FoodRow | null> {
    for (const f of this.foods.values()) {
      if (f.canonical_name === name) return f;
    }
    return null;
  }
  async getFoodsByIds(ids: number[]): Promise<FoodRow[]> {
    const out: FoodRow[] = [];
    for (const id of ids) {
      const f = this.foods.get(id);
      if (f) out.push(f);
    }
    return out;
  }
  async getAliasByKey(alias: string): Promise<AliasRow | null> {
    return this.aliases.get(alias) ?? null;
  }
  async fuzzySearchAliases(): Promise<ScoredAlias[]> { return []; }
  async fuzzySearchFoods(): Promise<ScoredFood[]> { return []; }
  async getAmbiguousCandidates(term: string): Promise<AmbiguousCandidate[]> {
    return this.ambiguity.get(term) ?? [];
  }
  async getMemoryEntry(userId: string, normalizedText: string): Promise<MealMemoryRow | null> {
    return this.memory.get(`${userId}:${normalizedText}`) ?? null;
  }
  async upsertMemoryEntry(userId: string, normalizedText: string, entry: MemoryWrite): Promise<void> {
    this.memoryWrites.push(entry);
    const key = `${userId}:${normalizedText}`;
    const previous = this.memory.get(key);
    this.memory.set(key, {
      user_id: userId,
      normalized_text: normalizedText,
      items: entry.items,
      total_kcal: entry.total_kcal,
      total_protein: entry.total_protein,
      total_fat: entry.total_fat,
      total_carbs: entry.total_carbs,
      uses: (previous?.uses ?? 0) + 1,
      last_used_at: new Date().toISOString(),
    });
  }
  async getPopularMeal(): Promise<PopularMealRow | null> { return null; }
  async getFoodPortions(foodId: number): Promise<FoodPortionRow[]> {
    return this.portions.get(foodId) ?? [];
  }
  async getAllAmbiguousTerms(): Promise<string[]> {
    return Array.from(this.ambiguity.keys());
  }
}

const TEST_CONFIG: ResolverConfig = {
  ...DEFAULT_RESOLVER_CONFIG,
  memoryReadEnabled: false,
  memoryWriteEnabled: true,
};

function setupDb(): FakeDb {
  const db = new FakeDb();

  // dal (34): bowl=150 (default), katori=100
  db.foods.set(34, makeFood({
    id: 34,
    canonical_name: 'dal',
    display_name: 'Dal (toor/arhar, cooked)',
    category: 'dal',
    kcal_per_100g: 116,
    protein_per_100g: 7.2,
    default_portion_grams: 150,
    default_portion_label: '1 bowl',
  }));
  db.portions.set(34, [
    { unit: 'bowl', grams: 150, is_default: true, confidence: 1 },
    { unit: 'katori', grams: 100, is_default: false, confidence: 1 },
  ]);

  // dal makhani (35): bowl=150
  // Match actual staging row: fiber_per_100g = 4 (so 150g gives fiber 6,
  // which the memory test stores as cached).
  db.foods.set(35, makeFood({
    id: 35,
    canonical_name: 'dal makhani',
    display_name: 'Dal Makhani',
    category: 'dal',
    kcal_per_100g: 140,
    protein_per_100g: 6,
    fat_per_100g: 7,
    fiber_per_100g: 4,
    default_portion_grams: 150,
    default_portion_label: '1 bowl',
  }));
  db.portions.set(35, [
    { unit: 'bowl', grams: 150, is_default: true, confidence: 1 },
  ]);

  // roti (5): piece=40 (never ambiguous)
  db.foods.set(5, makeFood({
    id: 5,
    canonical_name: 'roti',
    category: 'bread',
    kcal_per_100g: 297,
    protein_per_100g: 11,
    fat_per_100g: 5,
    carbs_per_100g: 51,
    fiber_per_100g: 4.9,
    default_portion_grams: 40,
    default_portion_label: '1 piece',
  }));
  db.portions.set(5, [
    { unit: 'piece', grams: 40, is_default: true, confidence: 1 },
  ]);

  // Ambiguity: dal is ambiguous, roti is not
  db.ambiguity.set('dal', [
    { food_id: 34, rank: 0 },
    { food_id: 35, rank: 1 },
  ]);

  return db;
}

describe('foodResolverV2 — katori via food_portions', () => {
  it('resolves "1 katori dal" to 100g (not 150g)', async () => {
    const db = setupDb();
    const r = await resolve(
      { userId: TEST_USER, rawText: '1 katori dal', mealType: 'lunch' },
      db,
      TEST_CONFIG,
    );
    const item = r.items[0];
    expect(item.grams).toBe(100);
    // It's ambiguous on dal type, but grams are correct.
    expect(item.was_ambiguous).toBe(true);
    expect(item.layer).toBe('ambiguous');
  });

  it('resolves "2 bowl dal" to 300g via food_portions bowl row', async () => {
    const db = setupDb();
    const r = await resolve(
      { userId: TEST_USER, rawText: '2 bowl dal', mealType: 'lunch' },
      db,
      TEST_CONFIG,
    );
    expect(r.items[0].grams).toBe(300);
  });

  it('resolves "1 bowl dal" to 150g', async () => {
    const db = setupDb();
    const r = await resolve(
      { userId: TEST_USER, rawText: '1 bowl dal', mealType: 'lunch' },
      db,
      TEST_CONFIG,
    );
    expect(r.items[0].grams).toBe(150);
  });
});

describe('foodResolverV2 — prep-strip integration', () => {
  it('strips "cooked" before matching', async () => {
    const db = setupDb();
    // Add "cooked dal" as a distinct food to prove strip runs BEFORE match.
    // If strip did not run, exact match would find nothing (no "cooked dal" row).
    // If strip did run, it becomes "dal" → finds food 34.
    const r = await resolve(
      { userId: TEST_USER, rawText: '1 bowl cooked dal', mealType: 'lunch' },
      db,
      TEST_CONFIG,
    );
    expect(r.items[0].food_id).toBe(34);
    // Raw text is preserved
    expect(r.items[0].raw_text).toBe('1 bowl cooked dal');
  });
});

describe('foodResolverV2 — memory re-flagging (a04 fix)', () => {
  it('memory hit with ambiguous input_term is re-flagged as ambiguous', async () => {
    const db = setupDb();
    // Simulate a stored memory row for "1 bowl dal" → dal makhani.
    const storedItems: ResolvedItem[] = [{
      raw_text: '1 bowl dal',
      input_term: 'dal',
      food_id: 35,
      canonical_name: 'dal makhani',
      category: 'dal',
      quantity: 1,
      unit: 'bowl',
      grams: 150,
      weight_basis: 'unknown',
      quantity_source: 'portion_reference',
      kcal: 210,
      protein: 9,
      fat: 10.5,
      carbs: 22.5,
      fiber: 6,
      confidence: 1,
      layer: 'user_selection',
      resolution_type: 'matched',
      requires_confirmation: false,
      oil_included: false,
      oil_status: 'unknown',
      oil_review_needed: false,
      was_ambiguous: false,
      kb_confidence: 1,
    }];
    db.memory.set(`${TEST_USER}:1 bowl dal`, {
      user_id: TEST_USER,
      normalized_text: '1 bowl dal',
      items: storedItems,
      total_kcal: 210,
      total_protein: 9,
      total_fat: 10.5,
      total_carbs: 22.5,
      uses: 1,
      last_used_at: new Date().toISOString(),
    });

    const r = await resolve(
      { userId: TEST_USER, rawText: '1 bowl dal', mealType: 'lunch' },
      db,
      { ...TEST_CONFIG, memoryReadEnabled: true },
    );

    // Memory hit succeeded...
    expect(r.metadata.memory_hit).toBe(true);
    // ...but ambiguity was re-detected via input_term
    expect(r.was_ambiguous).toBe(true);
    expect(r.items[0].was_ambiguous).toBe(true);
    expect(r.items[0].layer).toBe('ambiguous');
    expect(r.items[0].candidates?.length).toBeGreaterThanOrEqual(2);
  });

  it('memory hit with non-ambiguous input_term is NOT re-flagged', async () => {
    const db = setupDb();
    const storedItems: ResolvedItem[] = [{
      raw_text: '2 roti',
      input_term: 'roti',
      food_id: 5,
      canonical_name: 'roti',
      category: 'bread',
      quantity: 2,
      unit: null,
      grams: 80,
      weight_basis: 'unknown',
      quantity_source: 'portion_reference',
      kcal: 238,
      protein: 8.8,
      fat: 4,
      carbs: 40.8,
      fiber: 3.9,
      confidence: 1,
      layer: 'user_selection',
      resolution_type: 'matched',
      requires_confirmation: false,
      oil_included: false,
      oil_status: 'unknown',
      oil_review_needed: false,
      was_ambiguous: false,
      kb_confidence: 1,
    }];
    db.memory.set(`${TEST_USER}:2 roti`, {
      user_id: TEST_USER,
      normalized_text: '2 roti',
      items: storedItems,
      total_kcal: 238,
      total_protein: 8.8,
      total_fat: 4,
      total_carbs: 40.8,
      uses: 1,
      last_used_at: new Date().toISOString(),
    });

    const r = await resolve(
      { userId: TEST_USER, rawText: '2 roti', mealType: 'breakfast' },
      db,
      { ...TEST_CONFIG, memoryReadEnabled: true },
    );

    expect(r.metadata.memory_hit).toBe(true);
    expect(r.was_ambiguous).toBe(false);
    expect(r.items[0].layer).toBe('memory');
  });
});

describe('foodResolverV2 — memory write policy (Option B)', () => {
  it('does not write to memory for ambiguous meals', async () => {
    const db = setupDb();
    await resolve(
      { userId: TEST_USER, rawText: '1 bowl dal', mealType: 'lunch' },
      db,
      TEST_CONFIG,
    );
    expect(db.memoryWrites).toHaveLength(0);
  });

  it('writes to memory for deterministic, non-ambiguous meals', async () => {
    const db = setupDb();
    await resolve(
      { userId: TEST_USER, rawText: '2 roti', mealType: 'breakfast' },
      db,
      TEST_CONFIG,
    );
    expect(db.memoryWrites).toHaveLength(1);
    expect(db.memoryWrites[0].items[0].food_id).toBe(5);
  });
});

describe('foodResolverV2 — response shape', () => {
  it('always returns was_ambiguous, kb_confidence, ai_used fields', async () => {
    const db = setupDb();
    const r = await resolve(
      { userId: TEST_USER, rawText: '2 roti', mealType: 'breakfast' },
      db,
      TEST_CONFIG,
    );
    expect(r).toHaveProperty('was_ambiguous');
    expect(r).toHaveProperty('kb_confidence');
    expect(r.ai_used).toBe(false);
  });

  it('kb_confidence reflects portion source for deterministic item', async () => {
    const db = setupDb();
    const r = await resolve(
      { userId: TEST_USER, rawText: '2 roti', mealType: 'breakfast' },
      db,
      TEST_CONFIG,
    );
    // roti has food_portions piece row → source='exact_unit' → factor 1.0
    // exact match confidence 0.95 → kb_confidence 0.95
    expect(r.kb_confidence).toBeGreaterThanOrEqual(0.9);
    expect(r.kb_confidence).toBeLessThanOrEqual(1.0);
  });
});

describe('foodResolverV2 ? non-food modifier clauses', () => {
  function setupModifierDb(): FakeDb {
    const db = setupDb();
    db.foods.set(101, makeFood({
      id: 101,
      canonical_name: 'rice',
      oil_included: true,
      kcal_per_100g: 130,
      protein_per_100g: 2.7,
      fat_per_100g: 0.3,
      carbs_per_100g: 28,
      fiber_per_100g: 0.4,
      default_portion_grams: 100,
      default_portion_label: '100g',
    }));
    db.foods.set(102, makeFood({
      id: 102,
      canonical_name: 'chicken breast',
      oil_included: true,
      kcal_per_100g: 165,
      protein_per_100g: 31,
      fat_per_100g: 3.6,
      carbs_per_100g: 0,
      fiber_per_100g: 0,
      default_portion_grams: 100,
      default_portion_label: '100g',
    }));
    db.foods.set(103, makeFood({
      id: 103,
      canonical_name: 'raw chicken breast',
      oil_included: true,
      display_name: 'Chicken breast (raw)',
      kcal_per_100g: 120,
      protein_per_100g: 22.5,
      fat_per_100g: 2.6,
      carbs_per_100g: 0,
      fiber_per_100g: 0,
      default_portion_grams: 100,
      default_portion_label: '100g',
    }));
    db.foods.set(76, makeFood({
      id: 76,
      canonical_name: 'grilled chicken breast',
      category: 'meat',
      kcal_per_100g: 165,
      protein_per_100g: 31,
      fat_per_100g: 3.6,
      carbs_per_100g: 0,
      fiber_per_100g: 0,
      default_portion_grams: 100,
      default_portion_label: '100g',
    }));
    return db;
  }

  function setupQualifierDb(): FakeDb {
    const db = setupDb();
    db.aliases.set('rotis', {
      alias: 'rotis',
      food_id: 5,
      portion_grams: null,
      portion_unit: null,
      confidence: 0.95,
    });
    return db;
  }

  it('self-heals modifier cache from finished basis to unknown basis', async () => {
    const db = setupModifierDb();
    const chicken = db.foods.get(102)!;
    db.foods.set(102, { ...chicken, oil_included: false });
    const config = { ...TEST_CONFIG, memoryReadEnabled: true };
    const key = `${TEST_USER}:150g chicken breast`;

    const first = await resolve(
      {
        userId: TEST_USER,
        rawText: '150g chicken breast weighed after air frying, no oil',
        mealType: 'lunch',
      },
      db,
      config,
    );
    expect(first.items[0].weight_basis).toBe('finished');

    const second = await resolve(
      { userId: TEST_USER, rawText: '150g chicken breast', mealType: 'lunch' },
      db,
      config,
    );
    expect(second.metadata.memory_hit).toBe(false);
    expect(second.items[0].weight_basis).toBe('unknown');
    expect(db.memory.get(key)?.items[0].weight_basis).toBe('unknown');

    const third = await resolve(
      { userId: TEST_USER, rawText: '150g chicken breast', mealType: 'lunch' },
      db,
      config,
    );
    expect(third.metadata.memory_hit).toBe(true);
    expect(third.items[0].weight_basis).toBe('unknown');
  });

  it('self-heals modifier cache symmetrically from unknown to finished basis', async () => {
    const db = setupModifierDb();
    const chicken = db.foods.get(102)!;
    db.foods.set(102, { ...chicken, oil_included: false });
    const config = { ...TEST_CONFIG, memoryReadEnabled: true };

    const first = await resolve(
      { userId: TEST_USER, rawText: '150g chicken breast', mealType: 'lunch' },
      db,
      config,
    );
    expect(first.items[0].weight_basis).toBe('unknown');

    const modifiedText = '150g chicken breast weighed after air frying, no oil';
    const second = await resolve(
      { userId: TEST_USER, rawText: modifiedText, mealType: 'lunch' },
      db,
      config,
    );
    expect(second.metadata.memory_hit).toBe(false);
    expect(second.items[0].weight_basis).toBe('finished');

    const third = await resolve(
      { userId: TEST_USER, rawText: modifiedText, mealType: 'lunch' },
      db,
      config,
    );
    expect(third.metadata.memory_hit).toBe(true);
    expect(third.items[0].weight_basis).toBe('finished');
  });

  it('still serves an unchanged roti meal from memory', async () => {
    const db = setupDb();
    const config = { ...TEST_CONFIG, memoryReadEnabled: true };
    await resolve(
      { userId: TEST_USER, rawText: '2 roti', mealType: 'lunch' },
      db,
      config,
    );
    const second = await resolve(
      { userId: TEST_USER, rawText: '2 roti', mealType: 'lunch' },
      db,
      config,
    );

    expect(second.metadata.memory_hit).toBe(true);
  });

  it('re-resolves a stale cached item missing new fields', async () => {
    const db = setupModifierDb();
    const staleItem = {
      raw_text: '150g raw chicken breast',
      input_term: 'chicken breast',
      food_id: 76,
      canonical_name: 'grilled chicken breast',
      category: 'meat',
      quantity: 150,
      unit: 'g',
      grams: 150,
      weight_basis: undefined,
      quantity_source: undefined,
      kcal: 248,
      protein: 46.5,
      fat: 5.4,
      carbs: 0,
      fiber: 0,
      confidence: 0.95,
      layer: 'memory',
      resolution_type: 'matched',
      requires_confirmation: false,
      oil_included: false,
      oil_status: undefined,
      oil_review_needed: false,
      was_ambiguous: false,
      kb_confidence: 0.95,
    } as ResolvedItem;
    db.memory.set(`${TEST_USER}:150g raw chicken breast`, {
      user_id: TEST_USER,
      normalized_text: '150g raw chicken breast',
      items: [staleItem],
      total_kcal: 248,
      total_protein: 46.5,
      total_fat: 5.4,
      total_carbs: 0,
      uses: 1,
      last_used_at: new Date().toISOString(),
    });

    const result = await resolve(
      {
        userId: TEST_USER,
        rawText: '150g raw chicken breast',
        mealType: 'lunch',
      },
      db,
      { ...TEST_CONFIG, memoryReadEnabled: true },
    );

    expect(result.metadata.memory_hit).toBe(true);
    expect(result.items[0].food_id).toBe(103);
    expect(result.items[0].weight_basis).toBe('raw');
    expect(result.items[0].quantity_source).toBe('user_provided');
  });

  it('matches a specified total weight to estimated portions', async () => {
    const result = await resolve(
      { userId: TEST_USER, rawText: '2 rotis, 80g total', mealType: 'lunch' },
      setupQualifierDb(),
      TEST_CONFIG,
    );

    expect(result.items[0].grams).toBe(80);
    expect(result.unresolved_items.some((item) => item.input_term === 'total')).toBe(true);
    expect(result.assumptions).toContain(
      'Total weight of 80g matches the estimated portion total.',
    );
  });

  it('accepts a specified total weight within 1g of estimated portions', async () => {
    const result = await resolve(
      { userId: TEST_USER, rawText: '2 rotis, 81g total', mealType: 'lunch' },
      setupQualifierDb(),
      TEST_CONFIG,
    );

    expect(result.items[0].grams).toBe(80);
    expect(result.assumptions).toContain(
      'Total weight of 81g matches the estimated portion total.',
    );
  });

  it('reports a specified total weight that differs from estimated portions', async () => {
    const result = await resolve(
      { userId: TEST_USER, rawText: '2 rotis, 100g total', mealType: 'lunch' },
      setupQualifierDb(),
      TEST_CONFIG,
    );

    expect(result.items[0].grams).toBe(80);
    expect(result.unresolved_items.some((item) => item.input_term === 'total')).toBe(true);
    expect(result.assumptions).toContain(
      'You specified 100g total, but this estimate uses default portions totaling 80g. Tap Edit to adjust.',
    );
  });

  it('adds an assumption for a generic each qualifier', async () => {
    const result = await resolve(
      { userId: TEST_USER, rawText: '2 rotis, each', mealType: 'lunch' },
      setupQualifierDb(),
      TEST_CONFIG,
    );

    expect(result.assumptions).toContain(
      'Noted "each" instruction; used default portions for this meal.',
    );
  });

  it('marks explicit grams as user provided', async () => {
    const r = await resolve(
      { userId: TEST_USER, rawText: '150g raw chicken breast', mealType: 'lunch' },
      setupModifierDb(),
      TEST_CONFIG,
    );

    expect(r.items[0].quantity_source).toBe('user_provided');
  });

  it('marks katori portions as a portion reference', async () => {
    const r = await resolve(
      { userId: TEST_USER, rawText: '1 katori dal', mealType: 'lunch' },
      setupDb(),
      TEST_CONFIG,
    );

    expect(r.items[0].quantity_source).toBe('portion_reference');
    expect(r.items[0].grams).toBe(100);
  });

  it('marks bowl portions as a portion reference', async () => {
    const r = await resolve(
      { userId: TEST_USER, rawText: '1 bowl dal', mealType: 'lunch' },
      setupDb(),
      TEST_CONFIG,
    );

    expect(r.items[0].quantity_source).toBe('portion_reference');
    expect(r.items[0].grams).toBe(150);
  });

  it('marks legacy default portions as assumptions', async () => {
    const db = setupDb();
    db.portions.delete(34);

    const r = await resolve(
      { userId: TEST_USER, rawText: 'dal', mealType: 'lunch' },
      db,
      TEST_CONFIG,
    );

    expect(r.items[0].quantity_source).toBe('default_assumption');
    expect(r.assumptions?.some((text) => text.includes(
      'Used a default portion size for dal',
    ))).toBe(true);
  });

  it('combines quantity source with weight basis and oil status', async () => {
    const r = await resolve(
      {
        userId: TEST_USER,
        rawText: '150g raw chicken breast, no oil',
        mealType: 'lunch',
      },
      setupModifierDb(),
      TEST_CONFIG,
    );

    expect(r.items[0].quantity_source).toBe('user_provided');
    expect(r.items[0].weight_basis).toBe('raw');
    expect(r.items[0].oil_status).toBe('excluded');
  });

  it('records no oil as excluded when the KB dish profile includes oil', async () => {
    const db = setupDb();
    const dal = db.foods.get(34)!;
    db.foods.set(34, { ...dal, oil_included: true });

    const r = await resolve(
      { userId: TEST_USER, rawText: '1 bowl dal, no oil', mealType: 'lunch' },
      db,
      TEST_CONFIG,
    );

    expect(r.items[0].oil_status).toBe('excluded');
    expect(r.items[0].oil_review_needed).toBe(true);
    expect(r.items[0].oil_included).toBe(true);
    expect(r.assumptions?.some((text) => text.includes(
      'Dish profile includes oil; you specified no oil',
    ))).toBe(true);
  });

  it('records no oil as excluded without a review when the KB has no oil', async () => {
    const r = await resolve(
      { userId: TEST_USER, rawText: '1 bowl dal, no oil', mealType: 'lunch' },
      setupDb(),
      TEST_CONFIG,
    );

    expect(r.items[0].oil_status).toBe('excluded');
    expect(r.items[0].oil_review_needed).toBe(false);
    expect(r.assumptions?.some((text) => text.includes('oil'))).toBe(false);
  });

  it('records requested oil as included and flags a KB conflict', async () => {
    const db = setupModifierDb();
    const chicken = db.foods.get(102)!;
    db.foods.set(102, { ...chicken, oil_included: false });
    const r = await resolve(
      {
        userId: TEST_USER,
        rawText: '150g chicken breast with oil',
        mealType: 'lunch',
      },
      db,
      TEST_CONFIG,
    );

    expect(r.items[0].oil_status).toBe('included');
    expect(r.items[0].oil_review_needed).toBe(true);
    expect(r.items[0].oil_included).toBe(false);
    expect(r.assumptions?.some((text) => text.includes(
      'KB shows no oil but you requested oil',
    ))).toBe(true);
  });

  it('reports unspecified oil content for rice', async () => {
    const db = setupModifierDb();
    const rice = db.foods.get(101)!;
    db.foods.set(101, { ...rice, oil_included: false });
    const r = await resolve(
      { userId: TEST_USER, rawText: '200g cooked rice', mealType: 'lunch' },
      db,
      TEST_CONFIG,
    );

    expect(r.items[0].oil_status).toBe('unknown');
    expect(r.assumptions?.some((text) => text.includes('Oil content not specified'))).toBe(true);
  });

  it('preserves the oil instruction alongside cooking-method stripping', async () => {
    const r = await resolve(
      {
        userId: TEST_USER,
        rawText: '150g chicken breast weighed after air frying, no oil',
        mealType: 'lunch',
      },
      setupModifierDb(),
      TEST_CONFIG,
    );

    expect(r.items[0].oil_status).toBe('excluded');
    expect(r.items[0].weight_basis).toBe('finished');
    expect(r.assumptions?.some((text) => /air frying/i.test(text)) ?? false).toBe(false);
  });

  it('gives no-oil precedence and requires review for contradictory instructions', async () => {
    const r = await resolve(
      {
        userId: TEST_USER,
        rawText: '150g chicken breast with oil, no oil',
        mealType: 'lunch',
      },
      setupModifierDb(),
      TEST_CONFIG,
    );

    expect(r.items[0].oil_status).toBe('excluded');
    expect(r.items[0].oil_review_needed).toBe(true);
    expect(r.assumptions?.some((text) => text.includes('Conflicting oil instructions'))).toBe(true);
  });

  it('reapplies current oil context to a cached meal', async () => {
    const db = setupModifierDb();
    const chicken = db.foods.get(102)!;
    db.foods.set(102, { ...chicken, oil_included: true });
    const first = await resolve(
      { userId: TEST_USER, rawText: '150g chicken breast', mealType: 'lunch' },
      db,
      TEST_CONFIG,
    );
    db.memory.set(`${TEST_USER}:150g chicken breast`, {
      user_id: TEST_USER,
      normalized_text: '150g chicken breast',
      items: first.items,
      total_kcal: first.totals.kcal,
      total_protein: first.totals.protein,
      total_fat: first.totals.fat,
      total_carbs: first.totals.carbs,
      uses: 1,
      last_used_at: new Date().toISOString(),
    });

    const cached = await resolve(
      {
        userId: TEST_USER,
        rawText: '150g chicken breast, no oil',
        mealType: 'lunch',
      },
      db,
      { ...TEST_CONFIG, memoryReadEnabled: true },
    );

    expect(cached.metadata.memory_hit).toBe(true);
    expect(cached.items[0].oil_status).toBe('excluded');
    expect(cached.items[0].oil_review_needed).toBe(true);
    expect(cached.assumptions?.some((text) => text.includes(
      'Dish profile includes oil; you specified no oil',
    ))).toBe(true);
  });

  it('marks raw chicken without an assumption', async () => {
    const r = await resolve(
      { userId: TEST_USER, rawText: '150g raw chicken breast', mealType: 'lunch' },
      setupModifierDb(),
      TEST_CONFIG,
    );
    expect(r.items[0].weight_basis).toBe('raw');
    expect(r.assumptions).toBeUndefined();
  });

  it('marks cooked rice without an assumption', async () => {
    const r = await resolve(
      { userId: TEST_USER, rawText: '200g cooked rice', mealType: 'lunch' },
      setupModifierDb(),
      TEST_CONFIG,
    );
    expect(r.items[0].weight_basis).toBe('cooked');
    expect(r.assumptions).toBeUndefined();
  });

  it('adds an assumption for unqualified rice', async () => {
    const r = await resolve(
      { userId: TEST_USER, rawText: '200g rice', mealType: 'lunch' },
      setupModifierDb(),
      TEST_CONFIG,
    );
    expect(r.items[0].weight_basis).toBe('unknown');
    expect(r.assumptions).toContain('Assumed cooked weight for rice.');
  });

  it('does not assume cooked weight for roti', async () => {
    const r = await resolve(
      { userId: TEST_USER, rawText: '2 roti', mealType: 'lunch' },
      setupDb(),
      TEST_CONFIG,
    );

    expect(r.items[0].weight_basis).toBe('unknown');
    expect(r.assumptions?.some((text) => /Assumed cooked weight/i.test(text)) ?? false).toBe(false);
  });

  it('uses pre-strip context for a detached air-frying modifier', async () => {
    const db = setupModifierDb();
    const chicken = db.foods.get(102)!;
    db.foods.set(102, { ...chicken, oil_included: false });
    const r = await resolve(
      {
        userId: TEST_USER,
        rawText: '150g chicken breast weighed after air frying, no oil',
        mealType: 'lunch',
      },
      db,
      TEST_CONFIG,
    );
    expect(r.items[0].weight_basis).toBe('finished');
    expect(r.assumptions).toBeUndefined();
  });

  it('keeps mixed food weight bases independent', async () => {
    const r = await resolve(
      {
        userId: TEST_USER,
        rawText: '200g rice and 150g raw chicken breast',
        mealType: 'lunch',
      },
      setupModifierDb(),
      TEST_CONFIG,
    );
    expect(r.items.map((item) => item.weight_basis)).toEqual(['unknown', 'raw']);
    expect(r.assumptions).toEqual(['Assumed cooked weight for rice.']);
  });

  it('prefers the exact raw chicken variant before the stripped name', async () => {
    const db = setupModifierDb();
    const r = await resolve(
      { userId: TEST_USER, rawText: '150g raw chicken breast', mealType: 'lunch' },
      db,
      TEST_CONFIG,
    );

    expect(r.items).toHaveLength(1);
    expect(r.items[0].canonical_name).toBe('raw chicken breast');
    expect(r.items[0].kcal).toBe(180);
  });

  it('keeps unqualified chicken breast on the existing grilled variant', async () => {
    const db = setupModifierDb();
    const r = await resolve(
      { userId: TEST_USER, rawText: '150g chicken breast', mealType: 'lunch' },
      db,
      TEST_CONFIG,
    );

    expect(r.items).toHaveLength(1);
    expect(r.items[0].canonical_name).toBe('chicken breast');
    expect(r.items[0].kcal).toBe(248);
  });

  it('strips explicit cooking and oil context from the normalization input', () => {
    expect(normalizeInput('200g cooked rice and 150g chicken breast, weighed after air frying, no oil'))
      .toBe('200g cooked rice and 150g chicken breast');
  });

  it('keeps the exact reproduction input from becoming unresolved food clauses', async () => {
    const db = setupModifierDb();
    const r = await resolve(
      {
        userId: TEST_USER,
        rawText: '200g cooked rice and 150g chicken breast, weighed after air frying, no oil',
        mealType: 'lunch',
      },
      db,
      TEST_CONFIG,
    );

    expect(r.items.map((item) => item.canonical_name)).toEqual(['rice', 'chicken breast']);
    expect(r.unresolved_items).toHaveLength(0);
    expect(r.totals.kcal).toBeGreaterThan(0);
  });

  it('preserves genuinely unknown foods as unresolved items after stripping modifier clauses', async () => {
    const db = setupModifierDb();
    const r = await resolve(
      { userId: TEST_USER, rawText: '200g mystery grain, no oil', mealType: 'lunch' },
      db,
      TEST_CONFIG,
    );

    expect(r.items).toHaveLength(0);
    expect(r.unresolved_items.some((item) => item.input_term === 'mystery grain')).toBe(true);
  });
});
