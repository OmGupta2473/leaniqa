/**
 * Node-side ResolverDb implementation for the Phase 6.4 eval harness.
 *
 * Structurally identical to SupabaseResolverDb in
 * supabase/functions/resolve-meal/index.ts. Kept as a separate file
 * because the edge function file is Deno-flavored and pulls in the
 * edge-function-specific import map, while this file runs under tsx in
 * Node.
 *
 * If the resolver's ResolverDb interface changes, this file and its
 * Deno counterpart must both be updated.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ResolverDb,
  FoodRow,
  AliasRow,
  ScoredAlias,
  ScoredFood,
  AmbiguousCandidate,
  MealMemoryRow,
  PopularMealRow,
  MemoryWrite,
} from '../../supabase/functions/_shared/foodResolver';

export class StagingResolverDb implements ResolverDb {
  constructor(private readonly supabase: SupabaseClient) {}

  async getFoodByCanonicalName(canonicalName: string): Promise<FoodRow | null> {
    const { data, error } = await this.supabase
      .from('foods')
      .select('*')
      .eq('canonical_name', canonicalName)
      .order('source_rank', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) return null;
    return (data as FoodRow | null) ?? null;
  }

  async getFoodsByIds(ids: number[]): Promise<FoodRow[]> {
    if (ids.length === 0) return [];
    const { data, error } = await this.supabase
      .from('foods')
      .select('*')
      .in('id', ids);
    if (error) return [];
    return (data ?? []) as FoodRow[];
  }

  async getAliasByKey(alias: string): Promise<AliasRow | null> {
    const { data, error } = await this.supabase
      .from('food_aliases')
      .select('alias, food_id, portion_grams, portion_unit, confidence')
      .eq('alias', alias)
      .order('confidence', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return null;
    return (data as AliasRow | null) ?? null;
  }

  async fuzzySearchAliases(
    term: string,
    limit: number,
    minSimilarity: number,
  ): Promise<ScoredAlias[]> {
    const { data, error } = await this.supabase.rpc('search_food_aliases', {
      p_term: term,
      p_min_sim: minSimilarity,
      p_limit: limit,
    });
    if (error || !data) return [];
    return (data as Array<{
      alias: string;
      food_id: number;
      portion_grams: number | null;
      portion_unit: string | null;
      confidence: number;
      similarity: number;
    }>).map((r) => ({
      alias: {
        alias: r.alias,
        food_id: r.food_id,
        portion_grams: r.portion_grams,
        portion_unit: r.portion_unit,
        confidence: r.confidence,
      },
      similarity: r.similarity,
    }));
  }

  async fuzzySearchFoods(
    term: string,
    limit: number,
    minSimilarity: number,
  ): Promise<ScoredFood[]> {
    const { data, error } = await this.supabase.rpc('search_foods', {
      p_term: term,
      p_min_sim: minSimilarity,
      p_limit: limit,
    });
    if (error || !data) return [];
    const rows = data as Array<{ food_id: number; similarity: number }>;
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.food_id);
    const foods = await this.getFoodsByIds(ids);
    const byId = new Map(foods.map((f) => [f.id, f]));
    return rows
      .map((r) => {
        const food = byId.get(r.food_id);
        return food ? { food, similarity: r.similarity } : null;
      })
      .filter((x): x is ScoredFood => x != null);
  }

  async getAmbiguousCandidates(term: string): Promise<AmbiguousCandidate[]> {
    const { data, error } = await this.supabase
      .from('food_ambiguous_candidates')
      .select('food_id, rank')
      .eq('term', term)
      .order('rank', { ascending: true });
    if (error) return [];
    return (data ?? []) as AmbiguousCandidate[];
  }

  async getMemoryEntry(
    userId: string,
    normalizedText: string,
  ): Promise<MealMemoryRow | null> {
    const { data, error } = await this.supabase
      .from('user_meal_memory')
      .select('*')
      .eq('user_id', userId)
      .eq('normalized_text', normalizedText)
      .maybeSingle();
    if (error) return null;
    return (data as MealMemoryRow | null) ?? null;
  }

  async upsertMemoryEntry(
    userId: string,
    normalizedText: string,
    entry: MemoryWrite,
  ): Promise<void> {
    const { error } = await this.supabase
      .from('user_meal_memory')
      .upsert(
        {
          user_id: userId,
          normalized_text: normalizedText,
          items: entry.items,
          total_kcal: entry.total_kcal,
          total_protein: entry.total_protein,
          total_fat: entry.total_fat,
          total_carbs: entry.total_carbs,
          last_used_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,normalized_text' },
      );
    if (error) throw new Error(`memory upsert failed: ${error.message}`);
  }

  async getPopularMeal(normalizedText: string): Promise<PopularMealRow | null> {
    const { data, error } = await this.supabase
      .from('popular_meal_cache')
      .select('*')
      .eq('normalized_text', normalizedText)
      .maybeSingle();
    if (error) return null;
    return (data as PopularMealRow | null) ?? null;
  }
}