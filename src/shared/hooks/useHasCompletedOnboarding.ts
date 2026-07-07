import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/features/profile/services/profileService';
import { useAuthSession } from '@/router/useAuthSession';

export function useHasCompletedOnboarding() {
  const { session } = useAuthSession();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileService.getProfile(),
    enabled: !!session,
    staleTime: 5 * 60 * 1000,
  });

  const { data: goal, isLoading: goalLoading } = useQuery({
    queryKey: ['goal'],
    queryFn: () => profileService.getGoal(),
    enabled: !!session,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = profileLoading || goalLoading;
  const hasCompletedOnboarding = !!profile && !!goal;

  return { hasCompletedOnboarding, isLoading, profile, goal };
}
