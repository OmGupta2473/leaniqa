sed -i 's/const { onboardingData, goalSetCompleted } = useAppStore();/const { onboardingData } = useAppStore();\n  const { data: goal } = useQuery({ queryKey: ["goal"], queryFn: () => profileService.getGoal() });/g' src/screens/Dashboard.tsx
sed -i 's/!goalSetCompleted/!goal/g' src/screens/Dashboard.tsx
