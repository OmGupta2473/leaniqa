# R3 — Meal Parsing Spec (per-item KB → AI fallback → sum → save)

**Status:** Draft, awaiting lead approval.
**Scope:** R3.1 = backend only (staging). R3.2 = frontend only. R3.3 = rollout.
**Non-goals:** per-item meal history persistence (stays aggregate in `meal_logs`),
per-item editing in `PreCommitEditModal`, numeric confidence display, new DB
migrations, changes to `parse-meal`, changes to `resolve-meal` (v5).
**One-line goal:** split → resolve per-item (KB → AI fallback for unresolved) →
sum items → show per-item breakdown + total → user confirms → save exactly the
displayed total.

---

## A. Current-code audit (verified against the export)

| Area | Current behavior | File |
|---|---|---|
| Entry point | `resolve-meal-v2` validates, auths, calls `foodResolverV2.resolve()` | `supabase/functions/resolve-meal-v2/index.ts` |
| Splitter | splits on ` and ` (after `normalizeInput` expands `with`/`+`/`&`/`,`); only a **leading** quantity+unit is parsed | `_shared/foodResolverV2.ts` `splitIntoItems` |
| KB lookup | exact → alias → fuzzy (`search_food_aliases` then `search_foods`) | `_shared/foodResolverV2.ts` `resolveOneItem` |
| Unresolved | pushed to `unresolved_items`, excluded from `totals` | `_shared/foodResolverV2.ts` `resolveItems` |
| AI | **never** called by v2. `ai_used` hardcoded `false` | `_shared/foodResolverV2.ts` `finalize`; `resolve-meal-v2/index.ts` log insert |
| Prep words | strips `cooked|boiled|steamed|raw` from `food_name` only | `_shared/prepStrip.ts` |
| Portions | `food_portions` exact unit → `is_default` → legacy `default_portion_*` | `_shared/portionLookup.ts` `lookupPortion` |
| Totals | sum over `items` only | `_shared/foodResolverV2.ts` `aggregate` |
| Frontend fallback | if `unresolved_items.length > 0`, calls `parse-meal` with **the whole original text**, discarding v2 items | `MealLoggerPage.tsx` `resolveMealV2Mutation.onSuccess` |
| Frontend save | aggregate macros only | `MealLoggerPage.tsx` `confirmMealMutation` → `mealService.addMeal` |
| Storage | one aggregate row per meal in `meal_logs`; no item structure | migrations `20260624000000` + later |

### Known specific failures (verified)

- `"1 papad 8g"` → `food_name = "papad 8g"`, `unit = null` (trailing weight swallowed).
- `"chicken curry 4 pieces"` → `food_name = "chicken curry 4 pieces"`, `unit = null`.
- `"4 piece mutton curry"` → `quantity=4, unit="piece", food_name="mutton curry"`, then `lookupPortion(unit="piece")` returns null (no `piece` row and no matching legacy label) → item unresolved.
- `"100g raw rice"` → `food_name = "raw rice"` → stripped to `"rice"` → matches the cooked-rice profile (130 kcal/100g) instead of the raw-rice profile (360 kcal/100g).
- Partial-meal path: v2 items discarded, `parse-meal` aggregate shown, user can confirm and save an aggregate that omits the unresolved items.

### Non-issues that the prior audit flagged but are actually safe

- `"1 ghee"` does not split into `1g` + `hee` (the `\b` in `UNIT_ALT` prevents `g` from matching a prefix of a word).
- `"2-3 tbsp oil"` range parsing works.
- `"1 katori dal"` already resolves to `dal` via `food_portions.katori = 100g`.
- `oil_included` already exists on `foods` — no migration needed for R3.1.

---

## B. Response schema (v2, superset of current)

The R3 response is a backward-compatible superset of today's `ResolverResult`.
Existing fields (`items[].canonical_name`, `items[].protein`, etc.) are preserved.
New fields are additive.

```ts
interface R3Item {
  // ── preserved from today ──
  raw_text: string;
  input_term: string;
  food_id: number | null;
  canonical_name: string;
  category: string | null;
  quantity: number;
  unit: string | null;
  grams: number;
  kcal: number;
  protein: number;          // legacy name, still populated
  fat: number;
  carbs: number;
  fiber: number;
  confidence: number;       // 0..1 food-match confidence
  layer: MatchLayer;
  resolution_type: ResolutionType;
  requires_confirmation: boolean;
  candidates?: ClarificationCandidate[];
  oil_included: boolean;
  oil_review_needed: boolean;
  was_ambiguous: boolean;
  kb_confidence: number;

  // ── NEW in R3 ──
  food: string;             // = canonical_name (title-cased) or AI's food_label
  display: string;          // human string, e.g. "2 roti (whole wheat)"
  protein_g: number;        // = protein (alias)
  carbs_g: number;          // = carbs
  fat_g: number;            // = fat
  fiber_g: number;          // = fiber
  source: 'kb' | 'ai';      // 'kb' when layer != 'ai_fallback', else 'ai'
  note: string | null;      // required when source = 'ai'
}

interface R3Result {
  items: R3Item[];
  totals: { kcal; protein_g; carbs_g; fat_g; fiber_g };
  was_ambiguous: boolean;
  ai_used: boolean;
  unresolved_items: UnresolvedItem[];  // only items AI also could not resolve
  confidence: 'high' | 'medium' | 'low';  // categorical, from min(item.confidence)
  meal_confidence: number;                 // = min(item.confidence)
  kb_confidence: number;                   // = min(item.kb_confidence)
  request_id: string;
  source: 'v2_kb_primary';
}