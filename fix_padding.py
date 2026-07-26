with open('src/features/onboarding/pages/OnboardingPage.tsx', 'r') as f:
    content = f.read()

import re

# Remove pt-24
old_str = 'className={cn("flex-1 flex flex-col justify-center items-center px-6 relative z-10 w-full max-w-xl mx-auto", step > 0 && step < 8 ? "pt-24" : "")}'
new_str = 'className="flex-1 flex flex-col justify-center items-center px-6 relative z-10 w-full max-w-xl mx-auto py-8"'

if old_str in content:
    content = content.replace(old_str, new_str)
    print("Patched successfully.")
else:
    print("Could not find the string to replace.")

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'w') as f:
    f.write(content)
