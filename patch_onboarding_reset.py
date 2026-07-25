with open('src/features/onboarding/pages/OnboardingPage.tsx', 'r') as f:
    c = f.read()

c = c.replace("await profileService.resetProfile();", "await profileService.deleteProfile();\n      await profileService.deleteGoal();")
c = c.replace("useUserStore.getState().resetAll();", "useUserStore.getState().clearUserStore();")

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'w') as f:
    f.write(c)

print("Fixed")
