with open('src/features/onboarding/pages/OnboardingPage.tsx', 'r') as f:
    content = f.read()

old_names = '{["Athletic", "Fit", "Average fit", "Average", "Above average", "High body fat", "Obese"][p-1] || `Type ${p}`}'
new_names = '{["Essential fat", "Athletic", "Fit", "Average fit", "Average", "Above average", "High body fat"][p-1] || `Type ${p}`}'

if old_names in content:
    content = content.replace(old_names, new_names)
    print("Patched labels.")
else:
    print("Labels not found.")

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'w') as f:
    f.write(content)
