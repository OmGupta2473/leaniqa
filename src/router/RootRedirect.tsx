import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthSession } from './useAuthSession';
import { profileService } from '@/features/profile/services/profileService';

export function RootRedirect() {
  const { session, loading: loadingSession } = useAuthSession();

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileService.getProfile(),
    enabled: !!session,
  });

  const { data: goal, isLoading: loadingGoal } = useQuery({
    queryKey: ['goal'],
    queryFn: () => profileService.getGoal(),
    enabled: !!session && !!profile,
  });

  if (loadingSession) {
    return null;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (loadingProfile || (profile && loadingGoal)) {
    return null;
  }

  if (!profile) {
    return <Navigate to="/onboarding" replace />;
  }

  if (!goal) {
    return <Navigate to="/goal" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}
