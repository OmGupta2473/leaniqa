/**
 * Phase 6.7 R2.0 — preparation-word stripping.
 *
 * Removes cooking-state adjectives that do not change food identity.
 * "cooked toor dal" → "toor dal", "boiled egg" → "egg",
 * "steamed rice" → "rice", "raw banana" → "banana".
 *
 * Words that DO change nutrition are deliberately NOT stripped:
 *   fried, roasted, sautéed, buttered, tempered.
 * Those should route through normal matching (and may later trigger
 * cooking-method or oil-review logic in R2.3+).
 *
 * Implementation notes:
 *   - Word boundaries (\b) prevent stripping substrings. "uncooked" is
 *     preserved; "raws" is preserved; "steamedx" is preserved.
 *   - Case-insensitive. "Cooked Toor Dal" → "Toor Dal".
 *   - Global flag with String.replace is safe: replace() resets the
 *     regex's lastIndex internally, so no state carries between calls.
 *   - Empty input, empty result, or all-prep-words input return "".
 *     Callers that need a non-empty term are responsible for the
 *     fallback (e.g., use the original term if strip returns "").
 */

const PREP_WORDS_REGEX = /\b(cooked|boiled|steamed|raw)\b/gi;

export function stripPreparationWords(term: string): string {
  if (typeof term !== 'string') return '';
  return term.replace(PREP_WORDS_REGEX, ' ').replace(/\s+/g, ' ').trim();
}