with open('src/features/onboarding/pages/OnboardingPage.tsx', 'r') as f:
    content = f.read()

import re

# We want to replace the fixed progress indicator with a sticky one
old_str = 'className="fixed top-0 left-0 right-0 w-full px-4 sm:px-8 pt-8 pb-4 sm:pt-12 sm:pb-6 z-[100] flex items-center bg-[#0A0A0B] border-b border-[rgba(255,255,255,0.05)] shadow-md"'
new_str = 'className="sticky top-0 w-full px-4 sm:px-8 py-3 sm:py-4 z-50 flex items-center bg-[#0A0A0B]/90 backdrop-blur-md border-b border-[rgba(255,255,255,0.05)] shadow-md"'

if old_str in content:
    content = content.replace(old_str, new_str)
    print("Patched successfully.")
else:
    print("Could not find the string to replace.")

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'w') as f:
    f.write(content)
