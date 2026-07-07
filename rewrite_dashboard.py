import re

with open("src/features/dashboard/pages/DashboardPage.tsx", "r") as f:
    content = f.read()

# Add import for useCalculatedProfile
content = content.replace(
    'import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";',
    'import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";\nimport { useCalculatedProfile } from "@/shared/hooks/useCalculatedProfile";'
)

# Remove old onboardingData from userStore
content = re.sub(r'  const onboardingData = useUserStore\(s => s\.onboardingData\);\n', '', content)

# Remove old profile query
pattern_profile = r'  const {\n    data: profile,\n    isError: isProfileError,\n    error: profileError,\n    refetch: refetchProfile,\n  } = useQuery\({\n    queryKey: \["profile"\],\n    queryFn: \(\) => profileService\.getProfile\(\),\n  }\);\n'
content = re.sub(pattern_profile, '', content)

# Remove old goal query
pattern_goal = r'  const {\n    data: goal,\n    isError: isGoalError,\n    error: goalError,\n    refetch: refetchGoal,\n  } = useQuery\({ queryKey: \["goal"\], queryFn: \(\) => profileService\.getGoal\(\) }\);\n'
content = re.sub(pattern_goal, '', content)

# Insert new hook call
insertion = """  const { profileData: onboardingData, profile, goal } = useCalculatedProfile();
  const isProfileError = false;
  const isGoalError = false;
  const refetchProfile = () => {};
  const refetchGoal = () => {};
"""

content = content.replace('  const { dateDisplay } = useDateDisplay();\n', f'  const {{ dateDisplay }} = useDateDisplay();\n{insertion}\n')


with open("src/features/dashboard/pages/DashboardPage.tsx", "w") as f:
    f.write(content)
