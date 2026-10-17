# Phase 6.5 — Clarification Layer Backlog

Confirmed 2026-10-16 after the Phase 6.4 baseline evaluation. Items are
listed in execution order. `Phase 6.4 baseline: 87.1% food-match,
4.84% MAPE, 0.3g protein MAE`.

---

## Confirmed priorities

### P1. m05 — Add `aloo gobi sabzi` alias → `curated:aloo-gobi`

**Status:** Open
**Type:** Data (alias)
**Owner:** Phase 6.5

**Observed:** `aloo gobi sabzi` resolves via `local_search` to
`gobi sabzi` (105 kcal/100g) instead of `aloo gobi` (121 kcal/100g).
The fuzzy scorer prefers the shorter suffix match because it overlaps
more query trigrams than the longer prefix match.

**Fix:** Add explicit alias `aloo gobi sabzi` → `curated:aloo-gobi` in
`scripts/import/seed-aliases.ts`, then run the seed script against
staging. The alias layer will win before fuzzy search runs.

**Not fixed by this:** the general fuzzy-scorer bias toward suffix
matches. That is captured under D1 and D2.

**Anti-regression:** The Phase 6.4 eval meal m05 must resolve to
`aloo gobi` after the change. `aloo gobi`, `aloo gobhi`, and
`gobi sabzi` must continue to resolve to their existing foods.

---

### P2. m27 — Add `plate upma` alias with 200g portion

**Status:** Open
**Type:** Data (alias + portion)
**Owner:** Phase 6.5

**Observed:** `1 plate upma` returns one unresolved item. Two causes:
the tokenizer retains `plate` as part of the food name (no `plate`
entry in `UNIT_ALT`), and no `plate upma` alias exists in the curated
catalog.

**Fix:** Add explicit alias `plate upma` → `curated:upma` with
`portion_grams: 200, portion_unit: 'plate'`, distinct from the existing
`bowl upma` alias at 150g. Do **not** add `plate` to `UNIT_ALT` (see
D3).

**Anti-regression:** The Phase 6.4 eval meal m27 must resolve to
`upma` with a 200g portion after the change. `upma`, `bowl upma`, and
`1 katori upma` must continue to resolve to `upma` at their existing
portions.

---

### P3. m24 — `lassi` → `sweet lassi`

**Status:** Accepted drift — no action
**Type:** Canonical naming convention

The spike eval set calls the food `lassi`; the curated catalog calls
it `sweet lassi` in anticipation of a salted-lassi variant. Calories
and protein match exactly. The `food_match: NO` is a false negative
from the frozen spike's older naming.

Do not change resolver behavior for this meal. Documented in
`docs/PHASE_6.4_COMPLETE.md` §3.3.

---

### P4. m29 — `egg bhurji` vs `egg curry`

**Status:** Accepted drift — no action
**Type:** Spike eval set is stale

The curated catalog intentionally separates `egg bhurji`
(180 kcal/100g, 120g portion) from `egg curry` (120 kcal/100g, 150g
portion). The spike eval set treated them as one food. The input
`1 katori egg bhurji` correctly resolves to `egg bhurji`. The 20%
calorie error is entirely the spike's stale expectation.

Do not change resolver behavior for this meal. Documented in
`docs/PHASE_6.4_COMPLETE.md` §3.4.

---

### P5. Bare `sabzi` fuzzy-default shift

**Status:** Open, low priority
**Type:** Data interaction / fuzzy scoring
**Owner:** Phase 6.5

**Observed:** After P1 added the `aloo gobi sabzi` alias, the bare
input `sabzi` resolves via `local_search` to a default at 182 kcal
(aloo-gobi-like) instead of the previous 155 kcal (mixed-vegetable-like).

**Root cause:** `word_similarity('sabzi', 'aloo gobi sabzi')` now scores
higher than any of `mixed vegetable`'s aliases because the query term
appears as a whole word in the new alias. The `search_food_aliases`
RPC returns results ordered purely by `similarity DESC`, so the shorter
target alias wins.

**Impact:** None on eval scoring — a02 is ambiguous by design and
remains `requires_confirmation: true`. But the resolver's default
`default_guess` for the bare word `sabzi` is now data-dependent and
has drifted silently.

**Possible directions (no decision yet):**

- (A) Restrict `search_food_aliases` to prefer exact-alias matches
  first, only falling back to fuzzy when no exact match exists. This
  may already happen at the resolver level; the current layer output
  is `local_search`, suggesting `sabzi` is not an exact alias key.
- (B) Add `sabzi` as an explicit alias to `mixed vegetable` so the
  alias layer wins before fuzzy. Reverses the current behavior and
  pins it. Downside: `sabzi` is semantically generic and any pin is
  arbitrary.
- (C) Accept the shift as benign and document the current default.

Recommendation deferred. The behavior is functionally harmless today
and any fix would benefit from the Phase 6.5 clarification layer's
broader ambiguity-group design.

## Interpreting the Phase 6.4 baseline

The official baseline stands at **87.1% food-match accuracy**, **4.84%
calorie MAPE**, **11.5 kcal calorie MAE**, **0.3g protein MAE**.

Against the current curated catalog, two of the four `food_match: NO`
cases (m24, m29) are false negatives from stale spike naming or stale
spike food data. Adjusting only for those two drift cases, the
effective accuracy is:

- **29/31 = 93.5%** food-match accuracy

This corrected figure is interpretive context, not a change to the
frozen Phase 6.4 metric. The official 87.1% remains the number that
all future comparisons should cite as the Phase 6.4 baseline.

After P1 and P2 land, the expectation is that the raw food-match
accuracy improves to at least 93.5% by fixing m05 and m27. m24 and
m29 are expected to remain `food_match: NO`.

---

## Deferred to later phases

### D1. Suffix stripping for `sabzi`, `sabji`, `curry`

General problem of which suffixes are droppable. `sabzi` / `sabji`
is generally droppable when the remaining phrase matches a curated
dish. `curry` after a protein name (`chicken curry`, `mutton curry`,
`fish curry`) is load-bearing and must not be stripped. Needs a
rules-based design before code changes.

### D2. Same-dish-different-name

Beyond the two accepted drift cases (m24, m29), there is a broader
class where the same dish is named differently across datasets or
regions. The long-term fix is a curated family-mapping layer:
ambiguous inputs within a family return an ambiguity group with a
sensible default. This is the design work behind Phase 6.5's
clarification layer.

### D3. `plate` in `UNIT_ALT` — resolved decision: do not add

**Status:** Resolved (no action)
**Decision date:** 2026-10-16

The Phase 6.4 backlog proposed adding `plate` to the resolver's
`UNIT_ALT` alternation so that `1 plate X` parses as
`qty=1, unit=plate, food=X`. Investigation shows this would regress
meal m19 (`1 plate chicken biryani`):

- With `plate` in `UNIT_ALT`, m19 parses as `unit=plate, food=chicken biryani`.
- `tryExact("chicken biryani")` matches.
- `buildResolvedItem` calls `toGrams(1, "plate", chicken_biryani, null)`.
- The food's `default_portion_label` is `"1 bowl"`, which does not
  contain `"plate"`.
- `UNIT_GRAMS["plate"]` is undefined.
- `toGrams` returns `null` and the item goes to `unresolved_items`.
- m19 loses its current resolution (was passing at 326 kcal via fuzzy).

Adding `plate` to `UNIT_GRAMS` with a fixed gram weight would fix m19
but break the per-dish portion semantics: a plate of upma is ~200g, a
plate of biryani is ~200g, a plate of a small dish might be 150g.
There is no single gram value that is correct.

The correct pattern for `plate` is explicit per-dish aliases
(`plate upma` at 200g, `plate biryani` at 200g, etc.), which is what
P2 does. If a future phase wants general `plate` support, the
resolver's `tryAlias` would need to run before `tryExact` when the
unit is present, so that portion-carrying aliases can win. That is a
broader semantic change and belongs in a Phase 6.5 design discussion,
not in this P-item.

### D4. `_refunded` cleanup in `parse-meal`

**Status:** Open, low priority
**Type:** Edge function cleanup

In `supabase/functions/parse-meal/index.ts`, the `catch (chainErr)`
block initializes `let refunded = false;` and never reassigns it
after a successful `refund_api_usage` call. The `_refunded` field in
the error response is therefore always `false`, even when the refund
actually fired. No client depends on this field. Bundle the fix
with the next planned `parse-meal` deploy; do not deploy a standalone
hotfix.