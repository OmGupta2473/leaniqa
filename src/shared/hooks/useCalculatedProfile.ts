import { useHasCompletedOnboarding } from './useHasCompletedOnboarding';
import { useUserStore } from '@/features/profile/store/userStore';
import { calculateMacros, calculateGoalStats } from '../utils/profileCalculations';

export function useCalculatedProfile() {
  const { profile, goal, hasCompletedOnboarding, isLoading } = useHasCompletedOnboarding();
  const onboardingData = useUserStore(s => s.onboardingData);
  
  const mergedData = { ...onboardingData };

  if (profile) {
    mergedData.name = profile.name;
    mergedData.age = profile.age;
    mergedData.gender = profile.gender;
    mergedData.activityLevel = profile.activity_level;
    mergedData.weightKg = profile.weight;
    mergedData.heightCm = profile.height;
    mergedData.tdee = profile.maintenance_kcal;
    mergedData.proteinMid = profile.protein_target;

    const calcM = calculateMacros(profile.weight, profile.height, profile.age, profile.gender, profile.activity_level);
    mergedData.proteinMin = calcM.proteinMin;
    mergedData.proteinMax = calcM.proteinMax;
    mergedData.fatMin = calcM.fatMin;
    mergedData.fatMid = calcM.fatMid;
    mergedData.fatMax = calcM.fatMax;
    mergedData.carbMin = calcM.carbMin;
    mergedData.carbMid = calcM.carbMid;
    mergedData.carbMax = calcM.carbMax;
    mergedData.fiberMin = calcM.fiberMin;
    mergedData.fiberMax = calcM.fiberMax;
    mergedData.waterLitres = calcM.waterLitres;
    
    if (goal) {
      mergedData.currentBodyFatPct = goal.current_bf;
      mergedData.targetBodyFatPct = goal.target_bf;
      mergedData.chosenStrategyName = goal.strategy;
      mergedData.dailyDeficit = goal.deficit_kcal;
      
      const calcG = calculateGoalStats(calcM.tdee, profile.weight, goal.current_bf, goal.target_bf, goal.deficit_kcal);
      mergedData.fatToLoseKg = calcG.fatToLoseKg;
      mergedData.targetWeightKg = goal.target_weight || calcG.targetWeightKg;
      mergedData.dailyCalorieGoal = calcG.dailyCalorieGoal;
      mergedData.estimatedWeeks = calcG.estimatedWeeks;
      mergedData.estimatedCompletionDate = goal.target_date 
        ? new Date(goal.target_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : calcG.targetDateStr;
    }
  }

  return { profileData: mergedData, profile, goal, hasCompletedOnboarding, isLoading };
}
