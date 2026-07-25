sed -i "s|import { useQuery, useQueryClient } from \"@tanstack/react-query\";|import { useQueryClient } from \"@tanstack/react-query\";\nimport { useHasCompletedOnboarding } from '@/shared/hooks/useHasCompletedOnboarding';\nimport { calculateMacros, calculateGoalStats } from '@/shared/utils/profileCalculations';|" src/features/profile/pages/ProfilePage.tsx

sed -i "s|const { data: profile } = useQuery({ queryKey: \['profile'\], queryFn: () => profileService.getProfile() });|const { profile, goal } = useHasCompletedOnboarding();|" src/features/profile/pages/ProfilePage.tsx
