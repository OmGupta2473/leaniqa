sed -i "s|import { useUserStore } from \"@/features/profile/store/userStore\";|import { useCalculatedProfile } from \"@/shared/hooks/useCalculatedProfile\";\nimport { useUserStore } from \"@/features/profile/store/userStore\";|" src/features/nutrition/pages/CalorieDetailPage.tsx
sed -i "s|  const onboardingData = useUserStore(s => s.onboardingData);|  const { profileData: onboardingData } = useCalculatedProfile();|" src/features/nutrition/pages/CalorieDetailPage.tsx

sed -i "s|import { useUserStore } from \"@/features/profile/store/userStore\";|import { useCalculatedProfile } from \"@/shared/hooks/useCalculatedProfile\";\nimport { useUserStore } from \"@/features/profile/store/userStore\";|" src/features/nutrition/pages/ProteinDetailPage.tsx
sed -i "s|  const onboardingData = useUserStore(s => s.onboardingData);|  const { profileData: onboardingData } = useCalculatedProfile();|" src/features/nutrition/pages/ProteinDetailPage.tsx

sed -i "s|import { useUserStore } from \"@/features/profile/store/userStore\";|import { useCalculatedProfile } from \"@/shared/hooks/useCalculatedProfile\";\nimport { useUserStore } from \"@/features/profile/store/userStore\";|" src/features/transformation/pages/TransformationPage.tsx
sed -i "s|  const onboardingData = useUserStore(s => s.onboardingData);|  const { profileData: onboardingData } = useCalculatedProfile();|" src/features/transformation/pages/TransformationPage.tsx
