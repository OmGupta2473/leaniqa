import sys

with open('src/shared/hooks/useCalculatedProfile.ts', 'r') as f:
    content = f.read()

new_content = """import { useMemo } from 'react';
import { useHasCompletedOnboarding } from './useHasCompletedOnboarding';
import { useUserStore } from '@/features/profile/store/userStore';
import { calculateMacros, calculateGoalStats } from '../utils/profileCalculations';

export function useCalculatedProfile() {
  if (import.meta.env.DEV) console.time('[PERF] useCalculatedProfile');
  const { profile, goal, hasCompletedOnboarding, isLoading } = useHasCompletedOnboarding();
  const onboardingData = useUserStore(s => s.onboardingData);
  
  const mergedData = useMemo(() => {
    const data = { ...onboardingData };
    if (profile) {
      data.name = profile.name;
      data.age = profile.age;
      data.gender = profile.gender;
      data.activityLevel = profile.activity_level;
      data.weightKg = profile.weight;
      data.heightCm = profile.height;
      data.tdee = profile.maintenance_kcal;
      data.proteinMid = profile.protein_target;
      
      const calcM = calculateMacros(profile.weight, profile.height, profile.age, profile.gender, profile.activity_level);
      data.proteinMin = calcM.proteinMin;
      data.proteinMax = calcM.proteinMax;
      data.fatMin = calcM.fatMin;
      data.fatMid = calcM.fatMid;
      data.fatMax = calcM.fatMax;
      data.carbMin = calcM.carbMin;
      data.carbMid = calcM.carbMid;
      data.carbMax = calcM.carbMax;
      data.fiberMin = calcM.fiberMin;
      data.fiberMax = calcM.fiberMax;
      data.waterLitres = calcM.waterLitres;
      
      if (goal) {
        data.currentBodyFatPct = goal.current_bf;
        data.targetBodyFatPct = goal.target_bf;
        data.chosenStrategyName = goal.strategy;
        data.dailyDeficit = goal.deficit_kcal;
        
        const calcG = calculateGoalStats(calcM.tdee, profile.weight, goal.current_bf, goal.target_bf, goal.deficit_kcal);
        data.fatToLoseKg = calcG.fatToLoseKg;
        data.targetWeightKg = goal.target_weight || calcG.targetWeightKg;
        data.dailyCalorieGoal = calcG.dailyCalorieGoal;
        data.estimatedWeeks = calcG.estimatedWeeks;
        data.estimatedCompletionDate = goal.target_date 
          ? new Date(goal.target_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          : calcG.targetDateStr;
      }
    }
    return data;
  }, [onboardingData, profile, goal]);

  if (import.meta.env.DEV) console.timeEnd('[PERF] useCalculatedProfile');
  return { profileData: mergedData, profile, goal, hasCompletedOnboarding, isLoading };
}
"""

with open('src/shared/hooks/useCalculatedProfile.ts', 'w') as f:
    f.write(new_content)
