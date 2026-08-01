import re

with open('src/shared/hooks/useHasCompletedOnboarding.ts', 'r') as f:
    content = f.read()

if "import { useMultiAccountStore }" not in content:
    content = content.replace("import { useQuery } from '@tanstack/react-query';", "import { useQuery } from '@tanstack/react-query';\nimport { useMultiAccountStore } from '@/app/store/multiAccountStore';\nimport { useEffect } from 'react';\nimport { useAuthStore } from '@/app/store/authStore';")

old_query = """export function useHasCompletedOnboarding() {
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileService.getProfile(),
  });

  const { data: goal, isLoading: isGoalLoading } = useQuery({
    queryKey: ['goal'],
    queryFn: () => profileService.getGoal(),
  });"""

new_query = """export function useHasCompletedOnboarding() {
  const { session } = useAuthStore();
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileService.getProfile(),
  });

  const { data: goal, isLoading: isGoalLoading } = useQuery({
    queryKey: ['goal'],
    queryFn: () => profileService.getGoal(),
  });

  useEffect(() => {
    if (profile && session) {
      useMultiAccountStore.getState().addOrUpdateAccount(session, {
        name: profile.name,
      });
    }
  }, [profile, session]);"""

content = content.replace(old_query, new_query)

with open('src/shared/hooks/useHasCompletedOnboarding.ts', 'w') as f:
    f.write(content)

print("Updated useHasCompletedOnboarding.ts")
