import re

with open("src/features/profile/pages/ProfilePage.tsx", "r") as f:
    c = f.read()

c = c.replace(
    "import { useUserStore } from '@/features/profile/store/userStore';",
    "import { useUserStore } from '@/features/profile/store/userStore';\nimport { useChatStore } from '@/app/store';"
)

c = c.replace(
    """    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['goal'] });
      haptics.success();
      navigate('/onboarding/1');
    },""",
    """    onSuccess: () => {
      useUserStore.getState().clearUserStore();
      useChatStore.getState().clearChatStore();
      queryClient.setQueryData(['profile'], null);
      queryClient.setQueryData(['goal'], null);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['goal'] });
      haptics.success();
      navigate('/onboarding');
    },"""
)

with open("src/features/profile/pages/ProfilePage.tsx", "w") as f:
    f.write(c)

