import { useMemo } from 'react';
import { useHasCompletedOnboarding } from './useHasCompletedOnboarding';
import { useUserStore } from '@/features/profile/store/userStore';
import { calculateMacros, calculateGoalStats } from '../utils/profileCalculations';

export function useCalculatedProfile() {
  if (import.meta.env.DEV) console.time('[PERF] useCalculatedProfile');
  const { profile, goal, hasCompletedOnboarding, isLoading } = useHasCompletedOnboarding();
  const onboardingData = useUserStore(s => s.onboardingData);
  const macroOverrides = useUserStore(s => s.macroOverrides) || {};
  
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
          
        let fatPercentageMid = 0.265;
        const act = profile.activity_level as string;
        if (act === 'Sedentary') {
          fatPercentageMid = 0.25;
        } else if (act === 'Moderately Active' || act === 'Moderate') {
          fatPercentageMid = 0.275;
        } else if (act === 'Very Active' || act === 'Active') {
          fatPercentageMid = 0.285;
        } else if (act === 'Athlete' || act === 'Very active') {
          fatPercentageMid = 0.30;
        }

        let finalFat = profile.fat_target ?? macroOverrides.fat_target;
        let finalCarbs = profile.carbs_target ?? macroOverrides.carbs_target;
        let finalWater = profile.water_target ?? macroOverrides.water_target;

        if (finalFat == null && finalCarbs == null) {
          finalFat = Math.round((calcG.dailyCalorieGoal * fatPercentageMid) / 9);
          finalCarbs = Math.max(0, Math.round((calcG.dailyCalorieGoal - (profile.protein_target * 4) - (finalFat * 9)) / 4));
        } else if (finalFat != null && finalCarbs == null) {
          finalCarbs = Math.max(0, Math.round((calcG.dailyCalorieGoal - (profile.protein_target * 4) - (finalFat * 9)) / 4));
        } else if (finalFat == null && finalCarbs != null) {
          finalFat = Math.max(0, Math.round((calcG.dailyCalorieGoal - (profile.protein_target * 4) - (finalCarbs * 4)) / 9));
        }

        data.targetMacros = {
          protein: profile.protein_target,
          fat: finalFat,
          carbs: finalCarbs
        };
        data.manualOverrides = {
          carbs: finalCarbs != null,
          fat: finalFat != null,
          water: finalWater != null
        };
        if (finalWater) {
          data.waterLitres = finalWater;
        }
      }
    }
    return data;
  }, [onboardingData, profile, goal, macroOverrides]);

  if (import.meta.env.DEV) console.timeEnd('[PERF] useCalculatedProfile');
  return { profileData: mergedData, profile, goal, hasCompletedOnboarding, isLoading };
}
