import re

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'r') as f:
    content = f.read()

old_button = "onClick={() => setStep(gender === 'Male' ? 7 : 8)}"
new_button = "onClick={() => setStep(8)}"
if old_button in content:
    content = content.replace(old_button, new_button)
    print("Replaced continue button in step 6")

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'w') as f:
    f.write(content)
