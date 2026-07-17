import re

with open("src/features/onboarding/pages/OnboardingPage.tsx", "r") as f:
    c = f.read()

replacement = """                  onClick={async () => {
                    if (profile) {
                      try {
                        await profileService.deleteGoal();
                        await profileService.deleteProfile();
                        queryClient.setQueryData(['profile'], null);
                        queryClient.setQueryData(['goal'], null);
                        queryClient.invalidateQueries({ queryKey: ['profile'] });
                        queryClient.invalidateQueries({ queryKey: ['goal'] });
                      } catch (e) {
                        console.error('Failed to delete profile from db', e);
                      }
                    }
                    useUserStore.getState().clearUserStore();
                    clearChatStore();
                    window.location.reload();
                  }}"""

c = re.sub(r"onClick=\{\(\) => \{\n\s*setOnboardingData\(undefined\);\n\s*clearChatStore\(\);\n\s*window\.location\.reload\(\);\n\s*\}\}", replacement, c)

with open("src/features/onboarding/pages/OnboardingPage.tsx", "w") as f:
    f.write(c)
