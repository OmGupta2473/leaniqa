import { useQuery } from '@tanstack/react-query';
import { reportService } from '../services/reportService';
import { calculateCalorieStreak, calculateProteinStreak, computeEarnedAwards } from '../lib/streaks';

export function useStreaks() {
  const { data: metrics = [] } = useQuery({
    queryKey: ['dailyMetrics'],
    queryFn: () => reportService.getDailyMetrics(),
    // Enabled will be determined by whether the session exists, we can assume it's conditionally called or enabled globally if logged in.
  });

  const calorieStreak = calculateCalorieStreak(metrics);
  const proteinStreak = calculateProteinStreak(metrics);
  const earnedAwards = computeEarnedAwards(metrics);

  return {
    calorieStreak,
    proteinStreak,
    earnedAwards,
  };
}
