/**
 * Phase 6.7 R2.1 — unit tests for portionLookup.
 *
 * Pure vitest. Fake DB with a one-method interface.
 */

import { describe, it, expect } from 'vitest';
import {
  lookupPortion,
  hasReliablePortion,
  getPortionsForFood,
  type PortionLookupDb,
  type FoodPortionRow,
  type PortionLookupFood,
} from '../portionLookup';

class FakeDb implements PortionLookupDb {
  portions = new Map<number, FoodPortionRow[]>();

  async getFoodPortions(foodId: number): Promise<FoodPortionRow[]> {
    return this.portions.get(foodId) ?? [];
  }
}

function makeFood(
  overrides: Partial<PortionLookupFood> & { id: number },
): PortionLookupFood {
  return {
    default_portion_grams: null,
    default_portion_label: null,
    ...overrides,
  };
}

describe('lookupPortion', () => {
  // -------------------------------------------------------------------------
  // Passthrough — g/ml
  // -------------------------------------------------------------------------
  it('returns passthrough for unit=g (grams per 1)', async () => {
    const db = new FakeDb();
    const food = makeFood({ id: 1 });
    const r = await lookupPortion(db, food, 'g');
    expect(r).toEqual({ grams: 1, source: 'passthrough' });
  });

  it('returns passthrough for unit=ml', async () => {
    const db = new FakeDb();
    const food = makeFood({ id: 1 });
    const r = await lookupPortion(db, food, 'ml');
    expect(r).toEqual({ grams: 1, source: 'passthrough' });
  });

  // -------------------------------------------------------------------------
  // Exact unit match from food_portions — THE katori fix
  // -------------------------------------------------------------------------
  it('uses food_portions katori row (the katori fix)', async () => {
    const db = new FakeDb();
    db.portions.set(18, [
      { unit: 'bowl', grams: 150, is_default: true, confidence: 1 },
      { unit: 'katori', grams: 100, is_default: false, confidence: 1 },
    ]);
    const food = makeFood({ id: 18, default_portion_grams: 150, default_portion_label: '1 bowl' });
    const r = await lookupPortion(db, food, 'katori');
    expect(r).toEqual({ grams: 100, source: 'exact_unit' });
  });

  it('uses food_portions bowl row when katori not present', async () => {
    const db = new FakeDb();
    db.portions.set(34, [
      { unit: 'bowl', grams: 150, is_default: true, confidence: 1 },
    ]);
    const food = makeFood({ id: 34 });
    const r = await lookupPortion(db, food, 'bowl');
    expect(r).toEqual({ grams: 150, source: 'exact_unit' });
  });

  it('prefers exact_unit over is_default', async () => {
    const db = new FakeDb();
    db.portions.set(5, [
      { unit: 'piece', grams: 40, is_default: true, confidence: 1 },
      { unit: 'slice', grams: 20, is_default: false, confidence: 1 },
    ]);
    const food = makeFood({ id: 5 });
    const r = await lookupPortion(db, food, 'slice');
    expect(r).toEqual({ grams: 20, source: 'exact_unit' });
  });

  // -------------------------------------------------------------------------
  // Default portion (unit = null)
  // -------------------------------------------------------------------------
  it('uses is_default food_portions row when unit is null', async () => {
    const db = new FakeDb();
    db.portions.set(91, [
      { unit: 'glass', grams: 240, is_default: true, confidence: 1 },
    ]);
    const food = makeFood({ id: 91 });
    const r = await lookupPortion(db, food, null);
    expect(r).toEqual({ grams: 240, source: 'default' });
  });

  it('falls back to legacy default when unit is null and no food_portions rows', async () => {
    const db = new FakeDb();
    const food = makeFood({ id: 100, default_portion_grams: 150, default_portion_label: '1 bowl' });
    const r = await lookupPortion(db, food, null);
    expect(r).toEqual({ grams: 150, source: 'legacy_default' });
  });

  // -------------------------------------------------------------------------
  // Legacy fallback with unit
  // -------------------------------------------------------------------------
  it('falls back to legacy default only if label includes the unit', async () => {
    const db = new FakeDb();
    const food = makeFood({ id: 50, default_portion_grams: 150, default_portion_label: '1 bowl' });
    const r = await lookupPortion(db, food, 'bowl');
    expect(r).toEqual({ grams: 150, source: 'legacy_default' });
  });

  it('returns null when unit missing from both tables and label does not match', async () => {
    const db = new FakeDb();
    const food = makeFood({ id: 50, default_portion_grams: 150, default_portion_label: '1 bowl' });
    // Legacy label is "1 bowl"; asked for "katori" — no exact match,
    // no label substring, no is_default path (unit is non-null).
    const r = await lookupPortion(db, food, 'katori');
    expect(r).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Unit-null food with no portion data at all
  // -------------------------------------------------------------------------
  it('returns null when unit is null and no portion data exists', async () => {
    const db = new FakeDb();
    const food = makeFood({ id: 80 }); // chicken breast has "100g" label, no food_portions row
    const r = await lookupPortion(db, food, null);
    expect(r).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Zero-gram guards
  // -------------------------------------------------------------------------
  it('ignores zero-gram food_portions rows', async () => {
    const db = new FakeDb();
    db.portions.set(70, [
      { unit: 'bowl', grams: 0, is_default: true, confidence: 1 },
    ]);
    const food = makeFood({ id: 70 });
    const r = await lookupPortion(db, food, 'bowl');
    // zero-gram row rejected; no legacy default → null
    expect(r).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Case-insensitive label match
  // -------------------------------------------------------------------------
  it('matches legacy label case-insensitively', async () => {
    const db = new FakeDb();
    const food = makeFood({ id: 132, default_portion_grams: 150, default_portion_label: '1 Cup' });
    const r = await lookupPortion(db, food, 'cup');
    expect(r).toEqual({ grams: 150, source: 'legacy_default' });
  });
});

describe('hasReliablePortion', () => {
  it('true when food_portions rows exist', async () => {
    const db = new FakeDb();
    db.portions.set(18, [
      { unit: 'bowl', grams: 150, is_default: true, confidence: 1 },
    ]);
    const food = makeFood({ id: 18 });
    expect(await hasReliablePortion(db, food)).toBe(true);
  });

  it('true when legacy default_grams + default_label are both set', async () => {
    const db = new FakeDb();
    const food = makeFood({ id: 100, default_portion_grams: 150, default_portion_label: '1 bowl' });
    expect(await hasReliablePortion(db, food)).toBe(true);
  });

  it('false when neither source is present', async () => {
    const db = new FakeDb();
    const food = makeFood({ id: 80 });
    expect(await hasReliablePortion(db, food)).toBe(false);
  });

  it('false when only default_grams is set without label', async () => {
    const db = new FakeDb();
    const food = makeFood({ id: 100, default_portion_grams: 150, default_portion_label: null });
    expect(await hasReliablePortion(db, food)).toBe(false);
  });
});

describe('getPortionsForFood', () => {
  it('returns all rows from the fake DB', async () => {
    const db = new FakeDb();
    db.portions.set(18, [
      { unit: 'bowl', grams: 150, is_default: true, confidence: 1 },
      { unit: 'katori', grams: 100, is_default: false, confidence: 1 },
    ]);
    const rows = await getPortionsForFood(db, 18);
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.unit)).toEqual(['bowl', 'katori']);
  });

  it('returns [] when no rows exist', async () => {
    const db = new FakeDb();
    const rows = await getPortionsForFood(db, 999);
    expect(rows).toEqual([]);
  });
});