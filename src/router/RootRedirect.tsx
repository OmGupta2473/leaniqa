import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthSession } from './useAuthSession';
import { profileService } from '../services/profileService';

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary text-text-secondary text-[14px]">
        Loading...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (loadingProfile || (profile && loadingGoal)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary text-text-secondary text-[14px]">
        Loading...
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/onboarding" replace />;
  }

  if (!goal) {
    return <Navigate to="/goal" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}
