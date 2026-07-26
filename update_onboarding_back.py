import re

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'r') as f:
    content = f.read()

old_back = "onClick={() => setStep(step === 9 ? 6 : (step === 7 ? 6 : step - 1))}"
new_back = "onClick={() => setStep(step === 9 ? 6 : (step === 8 ? 6 : step - 1))}"
content = content.replace(old_back, new_back)

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'w') as f:
    f.write(content)
