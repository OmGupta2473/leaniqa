import { describe, expect, it } from "vitest";
import { canonicalTotalsForSave, toAiMealUiState, type AiMealResponse } from "./mealInterpretationUi";

function makeResponse(overrides: Partial<AiMealResponse> = {}): AiMealResponse {
  return {
    meal_title: "2 Rotis + Dal",
    meal_style: "homemade",
    assumptions: ["2 medium rotis, ~60g each", "Dal cooked with 1 tsp ghee"],
    items: [
      {
        label: "2 rotis",
        quantity: 2,
        unit: "piece",
        grams: 80,
        preparation: "plain",
        calories: 240,
        protein: 8.8,
        carbs: 40.8,
        fat: 4,
        fiber: 3.9,
        oil_included: false,
        note: null,
      },
    ],
    totals: { calories: 240, protein: 8.8, carbs: 40.8, fat: 4, fiber: 3.9 },
    confidence: 92,
    needs_review: false,
    clarifying_questions: [],
    source: "ai",
    request_id: "req-1",
    ...overrides,
  };
}

describe("toAiMealUiState", () => {
  it("T-AIUI-1: maps a single-item response with showItemTable=false", () => {
    const ui = toAiMealUiState(makeResponse());
    expect(ui.showItemTable).toBe(false);
    expect(ui.title).toBe("2 Rotis + Dal");
    expect(ui.items).toHaveLength(1);
  });

  it("T-AIUI-2: showItemTable is true when items.length > 1", () => {
    const base = makeResponse();
    const ui = toAiMealUiState({
      ...base,
      items: [
        base.items[0],
        { ...base.items[0], label: "1 bowl dal", calories: 174, protein: 10.8 },
      ],
      totals: { calories: 414, protein: 19.6, carbs: 72, fat: 4.8, fiber: 8 },
    });
    expect(ui.showItemTable).toBe(true);
  });

  it("T-AIUI-3: canConfirm is ALWAYS true", () => {
    expect(toAiMealUiState(makeResponse({ needs_review: true, confidence: 20 })).canConfirm).toBe(true);
    expect(toAiMealUiState(makeResponse({ needs_review: false, confidence: 95 })).canConfirm).toBe(true);
  });

  it("T-AIUI-4: needsReview true when backend flag set", () => {
    const ui = toAiMealUiState(makeResponse({ needs_review: true, confidence: 90 }));
    expect(ui.needsReview).toBe(true);
  });

  it("T-AIUI-5: needsReview true when confidence < 60 even if backend flag false", () => {
    const ui = toAiMealUiState(makeResponse({ needs_review: false, confidence: 45 }));
    expect(ui.needsReview).toBe(true);
  });

  it("T-AIUI-6: needsReview false when backend flag false and confidence >= 60", () => {
    const ui = toAiMealUiState(makeResponse({ needs_review: false, confidence: 75 }));
    expect(ui.needsReview).toBe(false);
  });

  it("T-AIUI-7: missing fields default safely", () => {
    const ui = toAiMealUiState({
      ...makeResponse(),
      meal_title: "",
      assumptions: undefined as unknown as string[],
      clarifying_questions: undefined as unknown as string[],
    });
    expect(ui.title).toBe("Meal");
    expect(ui.assumptions).toEqual([]);
    expect(ui.clarifyingQuestions).toEqual([]);
  });
});

describe("canonicalTotalsForSave", () => {
  it("T-AIUI-8: returns backend totals verbatim — no re-rounding", () => {
    const ui = toAiMealUiState(
      makeResponse({
        totals: { calories: 647, protein: 38.1, carbs: 73.9, fat: 19.3, fiber: 6.2 },
      }),
    );
    expect(canonicalTotalsForSave(ui)).toEqual({
      calories: 647,
      protein: 38.1,
      carbs: 73.9,
      fat: 19.3,
      fiber: 6.2,
    });
  });
});