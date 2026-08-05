import { useQuery } from '@tanstack/react-query';
import { mealService } from '@/features/nutrition/services/mealService';
import { useCalculatedProfile } from '@/shared/hooks/useCalculatedProfile';
import { useNetworkConnectivity } from '@/shared/hooks/useNetworkConnectivity';

export function useDailyNutrition(date: Date) {
  const isOnline = useNetworkConnectivity();
  const dateKeyStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const { data: meals = [], isLoading: isMealsLoading, isError: isMealsError, refetch: refetchMeals } = useQuery({
    queryKey: ["meals", "date", dateKeyStr],
    queryFn: () => mealService.getMealsForDate(date),
  });

  const { profileData, isLoading: isProfileLoading } = useCalculatedProfile();

  const proteinTarget = Math.round(profileData?.targetMacros?.protein || 0);
  const dailyTargetKcal = Math.round(profileData?.dailyCalorieGoal || 0);
  const fatTarget = Math.round(profileData?.targetMacros?.fat || 0);
  const carbsTarget = Math.round(profileData?.targetMacros?.carbs || 0);

  const eatenKcal = Math.round(meals.reduce((acc, m) => acc + m.calories, 0));
  const eatenProtein = Math.round(meals.reduce((acc, m) => acc + m.protein, 0));
  const eatenFat = Math.round(meals.reduce((acc, m) => acc + m.fat, 0));
  const eatenCarbs = Math.round(meals.reduce((acc, m) => acc + m.carbs, 0));

  const remainingKcal = dailyTargetKcal ? dailyTargetKcal - eatenKcal : 0;
  const remainingProtein = proteinTarget ? proteinTarget - eatenProtein : 0;

  const calPct = dailyTargetKcal ? Math.min(eatenKcal / dailyTargetKcal, 1) : 0;
  const proPct = proteinTarget ? Math.min(eatenProtein / proteinTarget, 1) : 0;
  const fatPct = fatTarget ? Math.min(eatenFat / fatTarget, 1) : 0;
  const carbPct = carbsTarget ? Math.min(eatenCarbs / carbsTarget, 1) : 0;

  const completionScore = dailyTargetKcal ? Math.round(((calPct + proPct + fatPct + carbPct) / 4) * 100) : 0;

  return {
    dateKeyStr,
    meals,
    isMealsLoading,
    isMealsError,
    refetchMeals,
    isProfileLoading,
    profileData,
    proteinTarget,
    dailyTargetKcal,
    fatTarget,
    carbsTarget,
    eatenKcal,
    eatenProtein,
    eatenFat,
    eatenCarbs,
    remainingKcal,
    remainingProtein,
    calPct,
    proPct,
    fatPct,
    carbPct,
    completionScore,
    isOnline
  };
}
