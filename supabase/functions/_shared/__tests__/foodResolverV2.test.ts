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