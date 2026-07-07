import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthSession } from './useAuthSession';
import { ScreenSkeleton } from '@/shared/components/ScreenSkeleton';
import { useHasCompletedOnboarding } from '@/shared/hooks/useHasCompletedOnboarding';

export function ProtectedRoute() {
  const { session, loading: authLoading } = useAuthSession();
  const location = useLocation();
  const { hasCompletedOnboarding, isLoading: onboardingLoading } = useHasCompletedOnboarding();

  if (authLoading || (session && onboardingLoading)) {
    return <ScreenSkeleton />;
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  const isAllowedDuringOnboarding = location.pathname === '/onboarding' || location.pathname === '/goal';
  
  if (!hasCompletedOnboarding && !isAllowedDuringOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }
  
  if (hasCompletedOnboarding && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
