import { useQuery } from '@tanstack/react-query';
import { mealService } from '@/features/nutrition/services/mealService';
import { useCalculatedProfile } from '@/shared/hooks/useCalculatedProfile';
import { useNetworkConnectivity } from '@/shared/hooks/useNetworkConnectivity';
import { parseDateKey } from '@/shared/utils/dateKey';

export function useDailyNutrition(dateStr: string) {
  const isOnline = useNetworkConnectivity();

  const { data: meals = [], isLoading: isMealsLoading, isError: isMealsError, refetch: refetchMeals } = useQuery({
    queryKey: ["meals", "date", dateStr],
    queryFn: () => mealService.getMealsForDate(parseDateKey(dateStr)),
  });

  const { profileData, isLoading: isProfileLoading } = useCalculatedProfile();

  const proteinTarget = profileData?.targetMacros?.protein || 0;
  const dailyTargetKcal = profileData?.dailyCalorieGoal || 0;
  const fatTarget = profileData?.targetMacros?.fat || 0;
  const carbsTarget = profileData?.targetMacros?.carbs || 0;

  const round1 = (v: number) => Math.round(v * 10) / 10;
  const eatenKcal = round1(meals.reduce((acc, m) => acc + m.calories, 0));
  const eatenProtein = round1(meals.reduce((acc, m) => acc + m.protein, 0));
  const eatenFat = round1(meals.reduce((acc, m) => acc + m.fat, 0));
  const eatenCarbs = round1(meals.reduce((acc, m) => acc + m.carbs, 0));

  const remainingCalories = dailyTargetKcal ? round1(dailyTargetKcal - eatenKcal) : 0;
  const remainingProtein = proteinTarget ? round1(proteinTarget - eatenProtein) : 0;

  const calPct = dailyTargetKcal ? Math.min(eatenKcal / dailyTargetKcal, 1) : 0;
  const proPct = proteinTarget ? Math.min(eatenProtein / proteinTarget, 1) : 0;
  const fatPct = fatTarget ? Math.min(eatenFat / fatTarget, 1) : 0;
  const carbPct = carbsTarget ? Math.min(eatenCarbs / carbsTarget, 1) : 0;

  const completionScore = dailyTargetKcal ? Math.round(((calPct + proPct + fatPct + carbPct) / 4) * 100) : 0;

  return {
    dateKeyStr: dateStr,
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
    remaining: {
      calories: remainingCalories,
      protein: remainingProtein,
    },
    remainingKcal: remainingCalories,
    remainingProtein,
    calPct,
    proPct,
    fatPct,
    carbPct,
    completionScore,
    isOnline
  };
}
