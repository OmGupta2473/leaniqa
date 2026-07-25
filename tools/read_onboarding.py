import sys

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'r') as f:
    content = f.read()
    print(f"Read {len(content)} bytes")
    # let's save a copy
with open('src/features/onboarding/pages/OnboardingPage_original.tsx', 'w') as f:
    f.write(content)
