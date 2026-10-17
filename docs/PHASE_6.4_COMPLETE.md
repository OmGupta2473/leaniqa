# Phase 6.4 — Local Resolver Deployment & Evaluation

**Status:** Complete
**Date closed:** 2026-10-16
**Follow-on:** Phase 6.5 (clarification layer)

---

## 1. Scope delivered

- `supabase/functions/_shared/foodResolver.ts` — pure resolver, no AI,
  no credits, no HTTP. Shipped as part of `resolve-meal`'s bundle.
- `supabase/functions/resolve-meal/index.ts` — edge function that
  orchestrates the local resolver, optionally calls `parse-meal` as a
  fallback, and owns the credit reserve/refund lifecycle for the
  hybrid path.
- `supabase/functions/parse-meal/index.ts` — reviewed security hotfix
  (see §5) deployed to both staging and production.
- `supabase/migrations/20261017000003_search_food_rpcs.sql` —
  version-controlled, idempotent migration for the two pg_trgm RPCs the
  resolver's fuzzy layer depends on. Applied to staging only.

---

## 2. Baseline evaluation

Run against staging `yvtoxpsmxlrljpuqvzgv` using the 35-meal Phase 6.0
eval set (30 definite + 1 m21 split + 4 ambiguous). The harness lives at
`scripts/phase-6.4-eval/` and calls `resolve()` directly. No AI, no
credits, no edge function involved.

### 2.1 Headline metrics

| Metric                       | Value           |
| ---------------------------- | --------------- |
| Meals attempted              | 35              |
| Definite                     | 31              |
| Ambiguous                    | 4               |
| Errored                      | 0               |
| Food-match accuracy          | 87.1% (27/31)   |
| Calorie MAPE                 | 4.84%           |
| Calorie MAE                  | 11.5 kcal       |
| Protein MAE                  | 0.3 g           |
| Fully resolved (no unresolved)| 30/31           |
| Ambiguity flagged            | 4/4             |
| Average resolution time      | 759 ms          |

All Phase 6.0 targets met or beaten (≥70% food-match, <20% MAPE,
<15 g protein MAE).

### 2.2 Layer coverage

`exact` and `alias` handle the bulk of the set. `local_search` fires on
m05, m06, m07, m10, m15, m19, m22, m25 and resolves every one of them
at 0.75 confidence. `ambiguous` overlays m01, a01, a02, a03, a04 as
designed.

### 2.3 Ambiguity handling

All four ambiguous meals (`a01`–`a04`) returned
`requires_confirmation: true`, `meal_confidence: 0.50`, non-zero
`actual_kcal`, and the correct candidate list. This is the shape the
resolver was designed to produce: a default estimate the user can edit,
never a zero-macro dead end.

---

## 3. Known drift (accepted, no action)

These are differences between the frozen Phase 6.0 spike artifacts and
the current curated staging catalog. They are expected, benign, and
documented here so they are not re-investigated in future phases.

### 3.1 m02 — `1 bowl poha` (195 exp vs 180 act)

The spike's in-memory `poha` entry is 130 kcal/100g. The curated staging
catalog has 120 kcal/100g. The resolver matched the correct food; the
stale value is in the spike, not in staging. The curated value supersedes
the spike value.

### 3.2 m23 — `100g paneer tikka` (220 exp vs 200 act)

Same class of drift. Spike: 220 kcal/100g. Curated staging: 200 kcal/100g.
Curated value supersedes.

### 3.3 m24 — `1 glass lassi` (168 exp vs 168 act, food-match: NO)

Calories and protein match exactly. The canonical names differ: the
spike calls it `lassi`, the curated catalog calls it `sweet lassi`
(reflecting the curated catalog's intent to distinguish sweet vs salted
lassi in a future iteration). Naming convention difference, not a
resolution error.

### 3.4 m29 — `1 katori egg bhurji` (180 exp vs 216 act, food-match: NO)

The curated catalog intentionally separates `egg bhurji` (180 kcal/100g,
120g portion) from `egg curry` (120 kcal/100g, 150g portion). The spike
eval set treated them as one food. The resolver correctly resolved to
the curated `egg bhurji`. The eval set's expectation is stale; it will
not be modified because the spike is a frozen historical artifact.

---

## 4. Deployment state at close

### 4.1 Staging `yvtoxpsmxlrljpuqvzgv`

- `parse-meal` — post-hotfix version deployed 2026-10-16.
- `resolve-meal` — deployed 2026-10-16.
- Migration `20261017000003_search_food_rpcs.sql` applied.
- Environment: `USE_HYBRID_RESOLVER` unset. `INTERNAL_FUNCTION_SECRET`
  unset. AI provider secrets (`GEMINI_API_KEY`, `GROQ_API_KEY`,
  `CF_AI_API_TOKEN`, `CF_ACCOUNT_ID`) unset. Local-only resolution is
  the only path exercised in staging.

### 4.2 Production `hevkurreqyubqvpykisf`

- `parse-meal` — post-hotfix version deployed 2026-10-16.
- `resolve-meal` — **not deployed**.
- Environment: `USE_HYBRID_RESOLVER` unset. `INTERNAL_FUNCTION_SECRET`
  unset.
- Migration `20261017000003_search_food_rpcs.sql` — **not applied**.
  The production resolver does not need it until `resolve-meal` is
  deployed there.

### 4.3 CLI link state

`npx supabase` is linked to staging (`yvtoxpsmxlrljpuqvzgv`). Any
`functions deploy` or `db push` without an explicit `--project-ref`
targets staging. This is the desired default for the development flow.

---

## 5. parse-meal security hotfix — closure

### 5.1 Bug

The pre-hotfix `parse-meal` read `body._skip_quota === true` and used
it to skip the quota reserve. Any authenticated user could bypass AI
credits by adding `"_skip_quota": true` to the request body.

### 5.2 Fix

- Removed every reference to `body._skip_quota`.
- Quota reserve and automatic refund are gated on a single
  `internalCaller` boolean derived from the `x-internal-caller` header
  compared against `INTERNAL_FUNCTION_SECRET` via a constant-time
  byte-compare.
- `resolve-meal` sends the internal header when it calls `parse-meal`.
- With `INTERNAL_FUNCTION_SECRET` unset, the function behaves identically
  to pre-hotfix for normal users, and no caller can satisfy the internal
  check. This is the state both environments are in.

### 5.3 Verification

Bypass closure verified on staging by two calls to `parse-meal` with
a meal the KB cannot parse (`2 zorbax and 1 katori dal`):

| Test | Body                              | Request ID                              | Refunded | usage_count after |
| ---- | --------------------------------- | --------------------------------------- | -------- | ----------------- |
| A    | no `_skip_quota`                  | `1bd438a4-fd87-4cf1-9656-4c9acc839691`  | Yes      | 0                 |
| B    | `"_skip_quota": true` in body     | `14f3162c-c005-4dc1-a62d-c5c9bb30c366`  | Yes      | 0                 |

Both request IDs appear in `api_usage_refunds`. The presence of a refund
row proves the reserve ran (a refund is only emitted after a successful
reserve). Test B carrying the old bypass flag produced the same outcome
as Test A. The vulnerability is closed.

### 5.4 Known cosmetic issue (not a security issue)

`parse-meal`'s `catch (chainErr)` block initializes
`let refunded = false;` and never sets it to `true` after a successful
`refund_api_usage` call. As a result, the `_refunded` field in the error
response body is always `false`, even when the refund did fire. The DB
state (`api_usage_refunds`, `api_usage.usage_count`) is correct; only
the in-response echo is wrong. No client currently depends on this field
for correctness. Not fixed in 6.4 to keep the hotfix diff minimal.

---

## 6. Artifacts

- `scripts/phase-6.4-eval/run.ts` — eval harness
- `scripts/phase-6.4-eval/stagingResolverDb.ts` — Node-side ResolverDb
- `scripts/phase-6.4-eval/README.md` — setup + usage
- `scripts/phase-6.4-eval/output.json` — last run's structured results
- `supabase/migrations/20261017000003_search_food_rpcs.sql`

---

## 7. What Phase 6.4 is not

- Not the hybrid resolver rollout. `USE_HYBRID_RESOLVER` remains unset
  everywhere. `resolve-meal` currently returns local-only results.
- Not the AI fallback test. Staging AI provider secrets remain unset by
  design; the AI path in `resolve-meal` has not been exercised.
- Not the clarification layer. The four ambiguous meals correctly flag
  `requires_confirmation: true` and return candidates, but no UI
  consumes them yet. That is Phase 6.5's job.
- Not the fuzzy-match tuning pass. Every current fuzzy resolution lands
  at 0.75, which the resolver treats as confirmation-required. Whether
  0.75 should auto-accept for known-good aliases is a Phase 6.5 call.

  ---

## Addendum — Phase 6.5 P1/P2 (2026-10-16)

Two backlog items from the Phase 6.4 failure analysis were implemented as
staging-only data changes on 2026-10-16. No resolver code was touched.

### P1 — `aloo gobi sabzi` alias

Added `aloo gobi sabzi` → `curated:aloo-gobi` to the curated alias seed.
m05 now resolves to `aloo gobi` via the alias layer at 0.80 confidence
(was `local_search` at 0.75 confidence, resolving to `gobi sabzi`).

### P2 — `plate upma` alias

Added `plate upma` → `curated:upma` with `portion_grams: 200,
portion_unit: 'plate'`, distinct from the existing `bowl upma` alias at
150g. m27 now resolves to `upma` via the alias layer at 0.90 confidence
(was unresolved).

### Post-P1/P2 eval

Run against staging on 2026-10-16, same config, same 35-meal set:

| Metric                 | Baseline  | Post-P1/P2 |
| ---------------------- | --------- | ---------- |
| Food-match accuracy    | 87.1%     | **93.5%**  |
| Calorie MAPE           | 4.84%     | **1.19%**  |
| Calorie MAE            | 11.5 kcal | **2.3 kcal** |
| Protein MAE            | 0.3 g     | **0.1 g**  |
| Fully resolved         | 30/31     | **31/31**  |
| Ambiguity flagged      | 4/4       | 4/4        |
| Errored                | 0         | 0          |

The two remaining `food_match: NO` cases are the accepted m24 and m29
drift documented in §3.3 and §3.4.

### New observation — a02 `sabzi`

The `sabzi` input (a02, an ambiguous meal) shifted from resolving to
`mixed vegetable` (155 kcal) to an aloo-gobi-like default (182 kcal) at
`local_search` layer. Caused by the new `aloo gobi sabzi` alias
containing `sabzi` as a whole word, which changes which alias wins the
fuzzy match for the bare term `sabzi`. Benign for scoring — a02 is
ambiguous by design and remains flagged. Captured as a Phase 6.5
backlog item.

### Baseline status

The official Phase 6.4 baseline remains **87.1%** for future
comparisons against the frozen spike. Post-P1/P2 is **93.5%** against
the current staging catalog. Both are recorded; they measure against
different expected values (spike-frozen vs curated-current).