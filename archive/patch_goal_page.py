import re

with open("src/features/goal/pages/GoalSetterPage.tsx", "r") as f:
    c = f.read()

c = c.replace(
    "import { useCalculatedProfile } from '@/shared/hooks/useCalculatedProfile';",
    "import { useCalculatedProfile } from '@/shared/hooks/useCalculatedProfile';\nimport { useUserStore } from '@/features/profile/store/userStore';"
)

c = c.replace(
    """                        await profileService.deleteGoal();
                        setResetGoalConfirm(false);
                        queryClient.setQueryData(['goal'], null);
                        navigate('/goal');""",
    """                        await profileService.deleteGoal();
                        setResetGoalConfirm(false);
                        queryClient.setQueryData(['goal'], null);
                        useUserStore.getState().setGoalWizardCurrentBfMid(null);
                        useUserStore.getState().setGoalWizardTargetBfMid(null);
                        navigate('/goal');"""
)

with open("src/features/goal/pages/GoalSetterPage.tsx", "w") as f:
    f.write(c)

