sed -i 's/const { onboardingData, setOnboardingData, goalSetCompleted, setGoalSetCompleted } = useAppStore();/const { onboardingData, setOnboardingData } = useAppStore();\n  const { data: goal } = useQuery({ queryKey: ["goal"], queryFn: () => profileService.getGoal() });/g' src/screens/GoalSetter.tsx
sed -i 's/if (goalSetCompleted)/if (goal)/g' src/screens/GoalSetter.tsx
sed -i '/setGoalSetCompleted(true);/d' src/screens/GoalSetter.tsx
