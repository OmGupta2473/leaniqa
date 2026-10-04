import type { Sex, ActivityLevel, GoalType } from '@/shared/utils/onboardingMath';

/**
 * In-progress onboarding answers for the Phase 1B 3-screen flow.
 * Persisted to localStorage per user so a refresh resumes at the same step.
 */
export interface OnboardingDraft {
  step: 1 | 2 | 3;
  name: string;
  sex: Sex | null;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  activity: ActivityLevel | null;
  dietaryPreference: 'veg' | 'egg' | 'nonveg' | null;
  goalOverride: GoalType | null;
  macroOverrides: { proteinG?: number; fatG?: number; carbsG?: number } | null;
}

export const EMPTY_DRAFT: OnboardingDraft = {
  step: 1,
  name: '', sex: null, age: null, heightCm: null, weightKg: null,
  activity: null, dietaryPreference: null, goalOverride: null, macroOverrides: null,
};
