sed -i 's/const { setOnboardingData, onboardingCompleted, setOnboardingCompleted, onboardingData, clearStore, editProfileMode, setEditProfileMode } = useAppStore();/const { setOnboardingData, onboardingData, clearStore, editProfileMode, setEditProfileMode } = useAppStore();\n  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => profileService.getProfile() });/g' src/screens/Onboarding.tsx
sed -i 's/if (onboardingCompleted && !isEditMode)/if (profile \&\& !isEditMode)/g' src/screens/Onboarding.tsx
sed -i '/setOnboardingCompleted(true);/d' src/screens/Onboarding.tsx
