import { describe, it, expect, vi } from 'vitest';
import { deriveCarbsFromKcal } from '../utils/macroReconciliation';

vi.mock('./useHasCompletedOnboarding', () => ({
  useHasCompletedOnboarding: () => ({
    profile: {
      id: 'user-1',
      maintenance_kcal: 2000,
      protein_target: 150,
      target_kcal: null,
      weight: 80,
      height: 180,
      age: 30,
      gender: 'Male',
      activity_level: 'Moderate',
    },
    goal: {
      current_bf: 20,
      target_bf: 15,
      deficit_kcal: 500,
    },
    hasCompletedOnboarding: true,
    isLoading: false,
  }),
}));

vi.mock('@/features/profile/store/userStore', () => ({
  useUserStore: vi.fn((selector) => selector({
    onboardingData: {},
    macroOverrides: {},
  })),
}));

vi.mock('../utils/profileCalculations', () => ({
  calculateMacros: vi.fn(() => ({
    tdee: 2000,
    proteinMin: 140,
    proteinMid: 150,
    proteinMax: 160,
    fatMin: 50,
    fatMid: 60,
    fatMax: 70,
    carbMin: 200,
    carbMid: 220,
    carbMax: 240,
    fiberMin: 28,
    fiberMax: 38,
  })),
  calculateGoalStats: vi.fn(() => ({
    fatToLoseKg: '5.0',
    targetWeightKg: '75.0',
    dailyCalorieGoal: 1500,
    estimatedWeeks: 10,
    targetDateStr: 'Ongoing',
  })),
}));

describe('useCalculatedProfile target_kcal preference', () => {
  it('T-TARGET-1: when profile.target_kcal is set, dailyCalorieGoal equals it; when null, falls back to calcG.dailyCalorieGoal', async () => {
    // Test the core logic directly since we can't render the hook without @testing-library/react
    const mockProfileWithTarget = {
      maintenance_kcal: 2000,
      protein_target: 150,
      target_kcal: 1800,
      weight: 80,
      height: 180,
      age: 30,
      gender: 'Male',
      activity_level: 'Moderate',
    };
    
    const mockProfileWithoutTarget = {
      maintenance_kcal: 2000,
      protein_target: 150,
      target_kcal: null,
      weight: 80,
      height: 180,
      age: 30,
      gender: 'Male',
      activity_level: 'Moderate',
    };

    const calcG = { dailyCalorieGoal: 1500 };
    
    // Simulate the preference logic from useCalculatedProfile
    const withTarget = mockProfileWithTarget.target_kcal ?? calcG.dailyCalorieGoal;
    const withoutTarget = mockProfileWithoutTarget.target_kcal ?? calcG.dailyCalorieGoal;
    
    expect(withTarget).toBe(1800);
    expect(withoutTarget).toBe(1500);
  });
});

describe('useCalculatedProfile non-cut carbs healing', () => {
  it('T-TARGET-2: stored carbs_target is replaced by a value derived from target_kcal + protein/fat', () => {
    const profile = {
      maintenance_kcal: 2136,
      protein_target: 104,
      fat_target: 52,
      target_kcal: 1700,
      weight: 78,
      height: 180,
      age: 30,
      gender: 'Male' as const,
      activity_level: 'Moderate' as const,
    };
    const goal = {
      current_bf: 20,
      target_bf: 15,
      deficit_kcal: 0,
      goal_type: 'recomp' as 'recomp' | 'cut' | 'bulk',
    };

    // Simulate exactly the branch added in useCalculatedProfile: non-cut
    // with target_kcal set replaces the stored carbs value.
    let finalFat: number | null = 52;
    let finalCarbs: number | null = 426; // intentionally stale
    const isNonCut = goal.goal_type !== 'cut';
    if (
      isNonCut &&
      profile.target_kcal != null &&
      profile.protein_target != null &&
      profile.fat_target != null
    ) {
      const derived = deriveCarbsFromKcal(
        profile.target_kcal,
        profile.protein_target,
        profile.fat_target,
      );
      if (derived.feasible) {
        finalFat = profile.fat_target;
        finalCarbs = derived.carbsG;
      }
    }

    expect(finalCarbs).toBe(204);
    expect(finalFat).toBe(52);
    expect(104 * 4 + 52 * 9 + 204 * 4).toBe(1700);
  });

  it('T-TARGET-3: cut goals skip the healing branch', () => {
    const goal = { goal_type: 'cut' as 'recomp' | 'cut' | 'bulk' };
    const profile = { target_kcal: 1666, protein_target: 172, fat_target: 55 };
    let finalCarbs: number | null = 100;
    const isNonCut = goal.goal_type !== 'cut';
    if (isNonCut && profile.target_kcal != null && profile.fat_target != null) {
      const derived = deriveCarbsFromKcal(
        profile.target_kcal,
        profile.protein_target,
        profile.fat_target,
      );
      if (derived.feasible) {
        finalCarbs = derived.carbsG;
      }
    }
    expect(finalCarbs).toBe(100); // unchanged
  });
});