# Phase 6.2 — Local Matching Foundation Backlog

Items carried over from the Phase 6.0 spike report. Each must land before
Phase 6.3's import runs, or the imported data will silently break on them.

---

## 1. Post-normalization alias keys

**Concern:** `normalize()` rewrites `katori → bowl` before any alias
lookup. Alias keys written as `katori dal` never fire — the resolver
queries `bowl dal` and misses.

**Fix:** every alias key in the `food_aliases` table must be written
after normalization. Add a Postgres CHECK constraint or a seed-time
validator that rejects any key containing a raw household word
(`katori`, `katoris`, `glass`, `bowl` is fine, but the *pre-normalized*
synonyms are not).

**Anti-regression test:** a Vitest unit test that normalizes each alias
key, re-queries the alias map, and asserts the entry is still found.

---

## 2. Normalized portion labels

**Concern:** `FoodRecord.default_portion_label` values must use the
same normalized units as the resolver. In the spike, `sambar` had
`default_portion_label: '1 katori'` which never matched the
post-normalization unit `bowl`, silently falling through to
`UNIT_GRAMS.bowl`.

**Fix:** normalize all `default_portion_label` values to one of:
`piece`, `slice`, `bowl`, `cup`, `glass`, `tbsp`, `tsp`, `g`, `ml`.
Add a schema check in the import script.

**Anti-regression test:** for every food, `toGrams(food, 1, derived_unit)`
must equal `food.default_portion_grams` where `derived_unit` is parsed
from `default_portion_label`.

---

## 3. Compound dish phrases

**Concern:** `rajma chawal`, `dal chawal`, `roti sabzi`, `idli sambar`,
`chole bhature` — two foods written as one token. The spike handled
`rajma chawal` and `chole bhature` by adding composite foods. About
30 such compounds exist in Indian home cooking.

**Fix options:**
- (A) Curate ~30 more compound dishes as first-class catalog entries.
- (B) Add a compound splitter that recognises known pairs and splits
  them into two items before resolution.

(A) is simpler and matches how users think. (B) is more general and
also handles the *quantity* case in item 4. Do (A) first.

**Anti-regression test:** a fixed set of 30 compound meal strings,
each expected to resolve to two items.

---

## 4. Compound quantity modifiers

**Concern:** `3 eggs bhurji` — the `3` binds to `eggs`, not to the whole
phrase. The spike's tokenizer treats this as one item with quantity 3.
The correct parse is `{3 piece egg}` + `{1 katori egg bhurji}` minus the
egg content, or more simply: `3 eggs` + `egg bhurji made from those 3`.

**Fix:** this is a structured-extraction problem, not a resolver problem.
The Phase 6.4 AI fallback handles it: the LLM extracts two items. Add
a specific few-shot example to the structured prompt so the LLM
reliably splits quantity-modifier compounds.

**Anti-regression test:** `3 eggs bhurji` and `2 chapati with paneer bhurji`
must each produce the correct item count.

---

## 5. Longest-first unit regex

**Concern:** In the spike, `g` matched the first character of `glass`,
producing `lass milk` and returning 1 kcal. The unit alternation must
list longest alternatives first:
`(glass|tbsp|tsp|scoop|piece|slice|bowl|cup|ml|g)`.

**Fix:** enforce this in the resolver code and add a comment warning
future maintainers. Postgres `pg_trgm` and any future regex passes
must follow the same rule.

**Anti-regression test:** `1 glass milk` must resolve to 240g and 156
kcal, not 1g and 0 kcal.

---

## 6. Ambiguity overlay preservation

**Concern:** Ambiguity is orthogonal to resolution. The resolver should
still compute a default estimate (so the user sees a number) while
flagging the food name as ambiguous. The response carries:
- `layer: "ambiguous"`
- `resolution_type: "default_guess"`
- `requires_confirmation: true`
- `candidates: [...]`

**Fix:** preserve this pattern in Phase 6.2. Do not collapse "ambiguous"
into a separate branch that skips resolution — that produces
`kcal: 0` and gives the user nothing to edit.

**Anti-regression test:** the four ambiguous meals from the Phase 6.0
eval (`dal`, `sabzi`, `curry`, `1 bowl dal`) must each return a
non-zero estimate AND `requires_confirmation: true`.

---

## 7. Eval set ambiguity correction (Phase 6.0 retrospective)

**Concern:** The original `m21` test was `1 cup tea`, expected 150 kcal.
The AI returned 2 kcal. Both interpretations are defensible. The test
itself was ambiguous.

**Fix:** the eval set now splits this into two meals:
- `1 cup tea with milk and sugar` → `chai` → 150 kcal
- `1 cup plain tea without milk or sugar` → `plain_tea` → 2 kcal

Both interpretations are tested explicitly. This is a documentation
correction, not a code change.

**Product implication:** Phase 6.5's clarification layer must ask
"Was there milk and sugar?" whenever a beverage word (`tea`, `coffee`,
`milk`) appears with insufficient specificity. Add this to the
clarification question library.