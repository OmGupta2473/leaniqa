/**
 * Phase 6.7 R2.2 — ambiguity signal module.
 *
 * Detects ambiguity in a resolved item regardless of its resolution
 * layer. The v5 resolver only ran the ambiguity overlay for certain
 * layers (fuzzy, exact after null-resolution), which caused two
 * classes of bug:
 *
 *   1. Alias-resolved items that should have been ambiguous were
 *      silently accepted (a04 case study: "1 bowl dal" via the
 *      bowl-dal alias resolved before the overlay ran).
 *   2. Memory-recalled items with layer='user_selection' were treated
 *      as ground truth and skipped by the overlay, even though the
 *      underlying input_term ("dal") is genuinely ambiguous.
 *
 * This module provides pure detection primitives. The caller
 * (foodResolverV2.ts) is responsible for fetching the ambiguous-terms
 * set from the DB once per request and passing it in.
 *
 * No imports, no DB, no network. Fully unit-testable.
 */

export interface AmbiguityCheckItem {
  input_term: string;
  layer: string;
  candidates?: unknown[] | null;
}

/**
 * True when this single item is ambiguous, regardless of layer.
 *
 * Rules (any one suffices):
 *   1. layer === 'ambiguous'
 *   2. candidates.length >= 2
 *   3. input_term is a known ambiguous term
 *      (normalized case-insensitively, whitespace-trimmed)
 */
export function itemHasAmbiguitySignal(
  item: AmbiguityCheckItem,
  ambiguousTerms: ReadonlySet<string>,
): boolean {
  if (item.layer === 'ambiguous') return true;
  if ((item.candidates?.length ?? 0) >= 2) return true;
  const term = item.input_term.trim().toLowerCase();
  if (term.length > 0 && ambiguousTerms.has(term)) return true;
  return false;
}

/**
 * True when any item in the list is ambiguous. Used to populate
 * `was_ambiguous` on the top-level response.
 */
export function deriveWasAmbiguous(
  items: ReadonlyArray<AmbiguityCheckItem>,
  ambiguousTerms: ReadonlySet<string>,
): boolean {
  for (const item of items) {
    if (itemHasAmbiguitySignal(item, ambiguousTerms)) return true;
  }
  return false;
}

/**
 * True when this item should be excluded from user_meal_memory writes
 * because it was ever ambiguous. Per Option B: ambiguous-originated
 * meals never enter memory as ground truth.
 *
 * Semantically identical to itemHasAmbiguitySignal, but named
 * distinctly at the call site so the intent is clear.
 */
export function shouldBlockMemoryWrite(
  item: AmbiguityCheckItem,
  ambiguousTerms: ReadonlySet<string>,
): boolean {
  return itemHasAmbiguitySignal(item, ambiguousTerms);
}

/**
 * Normalize the ambiguous-terms list returned from the DB into a
 * Set<string> suitable for passing into the detection functions.
 *
 * The DB stores terms in canonical (already-normalized) form, so no
 * transformation is applied here — just trimming and lowercasing for
 * defensive safety against any future data drift.
 */
export function makeAmbiguousTermSet(
  terms: ReadonlyArray<string>,
): Set<string> {
  const out = new Set<string>();
  for (const t of terms) {
    const norm = t.trim().toLowerCase();
    if (norm.length > 0) out.add(norm);
  }
  return out;
}