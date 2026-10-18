/**
 * Phase 6.7 R2.2 — unit tests for ambiguitySignal.
 *
 * Pure vitest. No DB, no network.
 */

import { describe, it, expect } from 'vitest';
import {
  itemHasAmbiguitySignal,
  deriveWasAmbiguous,
  shouldBlockMemoryWrite,
  makeAmbiguousTermSet,
  type AmbiguityCheckItem,
} from '../ambiguitySignal';

function item(
  overrides: Partial<AmbiguityCheckItem> & { input_term: string },
): AmbiguityCheckItem {
  return {
    layer: 'exact',
    candidates: null,
    ...overrides,
  };
}

const DAL_TERMS = makeAmbiguousTermSet(['dal', 'sabzi', 'curry']);

describe('itemHasAmbiguitySignal', () => {
  // -------------------------------------------------------------------------
  // Rule 1: layer === 'ambiguous'
  // -------------------------------------------------------------------------
  it('returns true when layer is ambiguous', () => {
    expect(
      itemHasAmbiguitySignal(item({ input_term: 'xyz', layer: 'ambiguous' }), DAL_TERMS),
    ).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Rule 2: candidates.length >= 2
  // -------------------------------------------------------------------------
  it('returns true when candidates has 2+ entries', () => {
    expect(
      itemHasAmbiguitySignal(
        item({ input_term: 'xyz', layer: 'exact', candidates: [{}, {}] }),
        DAL_TERMS,
      ),
    ).toBe(true);
  });

  it('returns false when candidates has exactly 1 entry (and other rules do not fire)', () => {
    expect(
      itemHasAmbiguitySignal(
        item({ input_term: 'xyz', layer: 'exact', candidates: [{}] }),
        DAL_TERMS,
      ),
    ).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Rule 3: input_term in ambiguous terms — THE a04 fix
  // -------------------------------------------------------------------------
  it('returns true when input_term is a known ambiguous term, layer exact', () => {
    expect(
      itemHasAmbiguitySignal(item({ input_term: 'dal', layer: 'exact' }), DAL_TERMS),
    ).toBe(true);
  });

  it('returns true when input_term is a known ambiguous term, layer user_selection (a04 case)', () => {
    expect(
      itemHasAmbiguitySignal(
        item({ input_term: 'dal', layer: 'user_selection' }),
        DAL_TERMS,
      ),
    ).toBe(true);
  });

  it('returns true when input_term is a known ambiguous term, layer alias', () => {
    expect(
      itemHasAmbiguitySignal(item({ input_term: 'dal', layer: 'alias' }), DAL_TERMS),
    ).toBe(true);
  });

  it('is case-insensitive on input_term', () => {
    expect(
      itemHasAmbiguitySignal(item({ input_term: 'Dal', layer: 'exact' }), DAL_TERMS),
    ).toBe(true);
    expect(
      itemHasAmbiguitySignal(item({ input_term: 'DAL', layer: 'exact' }), DAL_TERMS),
    ).toBe(true);
  });

  it('trims whitespace before matching', () => {
    expect(
      itemHasAmbiguitySignal(item({ input_term: ' dal ', layer: 'exact' }), DAL_TERMS),
    ).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Negative cases
  // -------------------------------------------------------------------------
  it('returns false for a clean item on a non-ambiguous term', () => {
    expect(
      itemHasAmbiguitySignal(
        item({ input_term: 'roti', layer: 'exact' }),
        DAL_TERMS,
      ),
    ).toBe(false);
  });

  it('returns false for an empty input_term on a non-ambiguous layer', () => {
    expect(
      itemHasAmbiguitySignal(item({ input_term: '', layer: 'exact' }), DAL_TERMS),
    ).toBe(false);
  });

  it('returns false when ambiguous term set is empty and layer/candidates are clean', () => {
    const emptySet = makeAmbiguousTermSet([]);
    expect(
      itemHasAmbiguitySignal(item({ input_term: 'dal', layer: 'exact' }), emptySet),
    ).toBe(false);
  });
});

describe('deriveWasAmbiguous', () => {
  it('returns false for an empty items array', () => {
    expect(deriveWasAmbiguous([], DAL_TERMS)).toBe(false);
  });

  it('returns false when no item is ambiguous', () => {
    expect(
      deriveWasAmbiguous(
        [
          item({ input_term: 'roti', layer: 'exact' }),
          item({ input_term: 'chai', layer: 'exact' }),
        ],
        DAL_TERMS,
      ),
    ).toBe(false);
  });

  it('returns true when at least one item is ambiguous via layer', () => {
    expect(
      deriveWasAmbiguous(
        [
          item({ input_term: 'roti', layer: 'exact' }),
          item({ input_term: 'xyz', layer: 'ambiguous' }),
        ],
        DAL_TERMS,
      ),
    ).toBe(true);
  });

  it('returns true when at least one item is ambiguous via input_term (a04 case)', () => {
    expect(
      deriveWasAmbiguous(
        [
          item({ input_term: 'roti', layer: 'exact' }),
          item({ input_term: 'dal', layer: 'user_selection' }),
        ],
        DAL_TERMS,
      ),
    ).toBe(true);
  });

  it('returns true when at least one item is ambiguous via candidates', () => {
    expect(
      deriveWasAmbiguous(
        [
          item({ input_term: 'xyz', layer: 'exact', candidates: [{}, {}] }),
        ],
        DAL_TERMS,
      ),
    ).toBe(true);
  });
});

describe('shouldBlockMemoryWrite', () => {
  it('blocks when input_term is ambiguous (prevents future a04-class bugs)', () => {
    expect(
      shouldBlockMemoryWrite(
        item({ input_term: 'dal', layer: 'exact' }),
        DAL_TERMS,
      ),
    ).toBe(true);
  });

  it('does not block for a deterministic, non-ambiguous item', () => {
    expect(
      shouldBlockMemoryWrite(
        item({ input_term: 'roti', layer: 'exact' }),
        DAL_TERMS,
      ),
    ).toBe(false);
  });

  it('blocks when layer is user_selection and input_term is ambiguous (stale memory)', () => {
    expect(
      shouldBlockMemoryWrite(
        item({ input_term: 'dal', layer: 'user_selection' }),
        DAL_TERMS,
      ),
    ).toBe(true);
  });

  it('blocks when candidates indicate ambiguity', () => {
    expect(
      shouldBlockMemoryWrite(
        item({ input_term: 'xyz', layer: 'exact', candidates: [{}, {}] }),
        DAL_TERMS,
      ),
    ).toBe(true);
  });
});

describe('makeAmbiguousTermSet', () => {
  it('lowercases and trims input', () => {
    const s = makeAmbiguousTermSet([' DAL ', 'Sabzi']);
    expect(s.has('dal')).toBe(true);
    expect(s.has('sabzi')).toBe(true);
    expect(s.has(' DAL ')).toBe(false);
  });

  it('drops empty and whitespace-only strings', () => {
    const s = makeAmbiguousTermSet(['', '  ', 'dal']);
    expect(s.size).toBe(1);
    expect(s.has('dal')).toBe(true);
  });

  it('deduplicates', () => {
    const s = makeAmbiguousTermSet(['dal', 'Dal', 'DAL']);
    expect(s.size).toBe(1);
  });

  it('returns an empty set for empty input', () => {
    expect(makeAmbiguousTermSet([]).size).toBe(0);
  });
});