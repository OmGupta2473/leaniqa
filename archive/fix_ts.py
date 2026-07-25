import sys

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'r') as f:
    content = f.read()

content = content.replace('type: "spring"', 'type: "spring" as any')

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'w') as f:
    f.write(content)
