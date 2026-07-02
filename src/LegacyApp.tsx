import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppStore } from './store';
import { useQuery } from '@tanstack/react-query';
import { useAuthSession } from './router/useAuthSession';

export function LegacyApp() {
  const { syncFromMetrics } = useAppStore();
  const { session } = useAuthSession();
  const location = useLocation();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => import('./services/profileService').then(m => m.profileService.getProfile()),
    enabled: !!session,
  });

  const { data: goal } = useQuery({
    queryKey: ['goal'],
    queryFn: () => import('./services/profileService').then(m => m.profileService.getGoal()),
    enabled: !!session && !!profile,
  });

  useEffect(() => {
    const { onboardingCompleted, setOnboardingCompleted, goalSetCompleted, setGoalSetCompleted } = useAppStore.getState();
    if (profile && !onboardingCompleted) {
      setOnboardingCompleted(true);
    }
    if (goal && !goalSetCompleted) {
      setGoalSetCompleted(true);
    }
  }, [profile, goal]);

  const { data: dailyMetrics } = useQuery({
    queryKey: ['dailyMetrics'],
    queryFn: () => import('./services/reportService').then(m => m.reportService.getDailyMetrics()),
    enabled: !!session,
  });

  useEffect(() => {
    if (dailyMetrics) {
      syncFromMetrics(dailyMetrics);
    }
  }, [dailyMetrics, syncFromMetrics, location.pathname]);

  return null;
}
