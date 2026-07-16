import { useAuthSession } from '@/router/useAuthSession';
import { useHasCompletedOnboarding } from '@/shared/hooks/useHasCompletedOnboarding';
import { SplashScreen } from './SplashScreen';

export function AppLoadingScreen() {
  const { session, loading: authLoading } = useAuthSession();
  const { isLoading: onboardingLoading } = useHasCompletedOnboarding();

  // The app is fully initialized when auth is checked,
  // and if a session exists, onboarding data is also loaded.
  const isLoading = authLoading || (!!session && onboardingLoading);

  return <SplashScreen isLoading={isLoading} />;
}
