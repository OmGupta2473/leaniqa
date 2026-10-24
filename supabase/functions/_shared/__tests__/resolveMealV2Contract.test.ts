import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RESOLVER_CONFIG,
  resolve,
  type FoodRow,
  type ResolverDb,
} from '../foodResolverV2';

const rice: FoodRow = {
  id: 101,
  source: 'curated',
  source_id: 'curated:rice',
  source_rank: 0,
  canonical_name: 'rice',
  display_name: 'Rice',
  search_name: 'rice',
  category: 'grain',
  kcal_per_100g: 130,
  protein_per_100g: 2.7,
  fat_per_100g: 0.3,
  carbs_per_100g: 28,
  fiber_per_100g: 0.4,
  default_portion_grams: 100,
  default_portion_label: '100g',
  is_ambiguous: false,
  oil_included: false,
  oil_per_100g: null,
  provenance: null,
  review_status: 'provisional',
};

const db: ResolverDb = {
  async getFoodByCanonicalName(name) {
    return name === rice.canonical_name ? rice : null;
  },
  async getFoodsByIds(ids) {
    return ids.includes(rice.id) ? [rice] : [];
  },
  async getAliasByKey() {
    return null;
  },
  async fuzzySearchAliases() {
    return [];
  },
  async fuzzySearchFoods() {
    return [];
  },
  async getAmbiguousCandidates() {
    return [];
  },
  async getMemoryEntry() {
    return null;
  },
  async upsertMemoryEntry() {},
  async getPopularMeal() {
    return null;
  },
  async getFoodPortions() {
    return [];
  },
  async getAllAmbiguousTerms() {
    return [];
  },
};

describe('resolve-meal-v2 response contract', () => {
  it('exposes structured item fields and optional assumptions from the resolver result', async () => {
    const result = await resolve(
      { userId: 'contract-test-user', rawText: '200g rice', mealType: 'lunch' },
      db,
      {
        ...DEFAULT_RESOLVER_CONFIG,
        memoryReadEnabled: false,
        memoryWriteEnabled: false,
      },
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      weight_basis: 'unknown',
      oil_status: 'unknown',
      oil_review_needed: false,
      quantity_source: 'user_provided',
    });
    expect(result.assumptions).toContain('Assumed cooked weight for rice.');
    expect(result.assumptions).not.toContain(
      'Oil content not specified for rice; verify if important.',
    );
  });
});
