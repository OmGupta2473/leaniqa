import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from './store';
import { useQuery } from '@tanstack/react-query';
import { useAuthSession } from './router/useAuthSession';

const SCREEN_TO_ROUTE: Record<string, string> = {
  auth: '/login',
  onboard: '/onboarding',
  goal: '/goal',
  dash: '/dashboard',
  meal: '/meals',
  progress: '/progress',
  week: '/activity',
  pricing: '/pricing',
  profile: '/profile',
  transformation: '/transformation',
  calorieDetail: '/calorie',
  proteinDetail: '/protein',
  awards: '/awards'
};

const ROUTE_TO_SCREEN = Object.fromEntries(
  Object.entries(SCREEN_TO_ROUTE).map(([k, v]) => [v, k])
);

export function LegacyApp() {
  const { currentScreen, setScreen, syncFromMetrics } = useAppStore();
  const { session } = useAuthSession();
  const navigate = useNavigate();
  const location = useLocation();

  // Sync currentScreen -> Route
  useEffect(() => {
    const targetRoute = SCREEN_TO_ROUTE[currentScreen];
    if (targetRoute && targetRoute !== location.pathname) {
      navigate(targetRoute);
    }
  }, [currentScreen, navigate, location.pathname]);

  // Sync Route -> currentScreen
  useEffect(() => {
    const targetScreen = ROUTE_TO_SCREEN[location.pathname];
    if (targetScreen && targetScreen !== currentScreen) {
      setScreen(targetScreen);
    }
  }, [location.pathname, currentScreen, setScreen]);

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
  }, [dailyMetrics, syncFromMetrics]);

  return null;
}
