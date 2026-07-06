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

  const { data: goal, isLoading: goalLoading } = useQuery({
    queryKey: ['goal'],
    queryFn: () => profileService.getGoal(),
    enabled: !!session,
    staleTime: 5 * 60 * 1000,
  });

  if (authLoading || (session && (profileLoading || goalLoading))) {
    return <ScreenSkeleton />;
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  const hasCompletedOnboarding = !!profile && !!goal;
  
  if (!hasCompletedOnboarding && location.pathname !== '/onboarding' && location.pathname !== '/goal') {
    return <Navigate to="/onboarding" replace />;
  }
  
  if (hasCompletedOnboarding && (location.pathname === '/onboarding' || location.pathname === '/goal')) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
