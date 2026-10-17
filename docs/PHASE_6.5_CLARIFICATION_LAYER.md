# Phase 6.5 — Clarification Layer

**Status:** Complete (staging only)
**Date closed:** 2026-10-16
**Follow-on:** Frontend integration, salted-lassi variant, broader dish-family mapping

---

## 1. Overview

The clarification layer turns the resolver's ambiguity signal into a
user-facing choice. When an item's input term is listed in
`food_ambiguous_terms`, the resolver returns structured candidates the
UI can render. The client collects the user's selection and submits it
back to `resolve-meal` in a follow-up call. The second call returns the
same meal with the user's choices applied as ground truth.

The layer is entirely local: no AI, no credits, no `parse-meal`
involvement on the selection path.

---

## 2. Data shapes

### 2.1 `ClarificationCandidate`

Every candidate carries the food id, both display and canonical names,
a category, macros computed at the item's specific portion size, and
rank metadata.

```typescript
export interface ClarificationCandidate {
  food_id: number;
  display_name: string;
  canonical_name: string;
  category: string | null;
  grams: number;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  rank: number;
  is_default: boolean;
}