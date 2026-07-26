with open('src/features/onboarding/pages/OnboardingPage.tsx', 'r') as f:
    content = f.read()

old_names = '{["Lean", "Athletic", "Fit", "Average", "Skinny Fat", "Overweight", "Obese"][p-1] || `Type ${p}`}'
new_names = '{["Athletic", "Fit", "Average fit", "Average", "Above average", "High body fat", "Obese"][p-1] || `Type ${p}`}'

content = content.replace(old_names, new_names)

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'w') as f:
    f.write(content)
