import re

with open("src/features/dashboard/pages/DashboardPage.tsx", "r") as f:
    content = f.read()

insertion = """  const { profileData: onboardingData, profile, goal } = useCalculatedProfile();
  const isProfileError = false;
  const isGoalError = false;
  const profileError = null;
  const goalError = null;
  const refetchProfile = () => {};
  const refetchGoal = () => {};
"""

content = content.replace('  const queryClient = useQueryClient();\n', f'  const queryClient = useQueryClient();\n{insertion}\n')

with open("src/features/dashboard/pages/DashboardPage.tsx", "w") as f:
    f.write(content)
