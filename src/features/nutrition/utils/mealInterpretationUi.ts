/**
 * Frontend mapper for the AI-only resolve-meal-v2 response.
 *
 * Contract (see supabase/functions/_shared/aiOnlyMealEstimator.ts):
 *   - items[] and totals come from the backend, which recomputes totals
 *     from validated items — do NOT recompute here.
 *   - canConfirm is ALWAYS true. The user can log whatever the AI estimated;
 *     needsReview just shows an advisory banner.
 */

export type CanonicalTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
};

export interface AiMealItem {
  label: string;
  quantity: number;
  unit: string | null;
  grams: number;
  preparation: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  oil_included: boolean;
  note: string | null;
}

export interface AiMealResponse {
  meal_title: string;
  meal_style: "homemade" | "street-side" | "restaurant" | "other";
  assumptions: string[];
  items: AiMealItem[];
  totals: CanonicalTotals;
  confidence: number; // 0–100
  needs_review: boolean;
  clarifying_questions: string[];
  source?: string;
  request_id?: string;
  credits?: { used: number; limit: number; remaining: number };
}

export interface AiMealUiState {
  title: string;
  mealStyle: string;
  assumptions: string[];
  items: AiMealItem[];
  totals: CanonicalTotals;
  confidence: number;
  needsReview: boolean;
  clarifyingQuestions: string[];
  showItemTable: boolean;
  canConfirm: boolean;
}

const CONFIDENCE_REVIEW_THRESHOLD = 60;

export function toAiMealUiState(resp: AiMealResponse): AiMealUiState {
  const items = Array.isArray(resp.items) ? resp.items : [];
  const totals: CanonicalTotals = {
    calories: Number(resp.totals?.calories ?? 0),
    protein: Number(resp.totals?.protein ?? 0),
    carbs: Number(resp.totals?.carbs ?? 0),
    fat: Number(resp.totals?.fat ?? 0),
    fiber: Number(resp.totals?.fiber ?? 0),
  };
  const confidence = Number(resp.confidence ?? 0);
  const needsReview =
    resp.needs_review === true || confidence < CONFIDENCE_REVIEW_THRESHOLD;

  return {
    title: (resp.meal_title ?? "").trim() || "Meal",
    mealStyle: resp.meal_style ?? "other",
    assumptions: Array.isArray(resp.assumptions) ? resp.assumptions : [],
    items,
    totals,
    confidence,
    needsReview,
    clarifyingQuestions: Array.isArray(resp.clarifying_questions)
      ? resp.clarifying_questions
      : [],
    showItemTable: items.length > 1,
    // Always confirmable. needsReview only shows a warning banner.
    canConfirm: true,
  };
}

/**
 * Exact payload for the save mutation. Uses the backend-computed totals
 * verbatim — no re-rounding, no re-summing. This is what gets written to
 * `meal_logs` and reflected in daily nutrition.
 */
export function canonicalTotalsForSave(state: AiMealUiState) {
  return {
    calories: state.totals.calories,
    protein: state.totals.protein,
    carbs: state.totals.carbs,
    fat: state.totals.fat,
    fiber: state.totals.fiber,
  };
}