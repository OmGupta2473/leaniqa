import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthSession } from './useAuthSession';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/features/profile/services/profileService';
import { ScreenSkeleton } from '@/shared/components/ScreenSkeleton';

export function ProtectedRoute() {
  const { session, loading: authLoading } = useAuthSession();
  const location = useLocation();
  
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileService.getProfile(),
    enabled: !!session,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (authLoading || (session && profileLoading)) {
    return <ScreenSkeleton />;
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  const isAllowedDuringOnboarding = location.pathname === '/onboarding' || location.pathname === '/goal';
  const hasCompletedOnboarding = profile?.onboarding_completed;
  
  if (!hasCompletedOnboarding && !isAllowedDuringOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }
  
  if (hasCompletedOnboarding && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
