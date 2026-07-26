with open('src/features/onboarding/pages/OnboardingPage.tsx', 'r') as f:
    content = f.read()

content = content.replace('[1, 2, 3, 4, 5, 6, 7].map', '[1, 2, 3, 4, 5, 6, 7, 8].map')
content = content.replace('src={`/male_physique_${p}.png`}', 'src={`/male_physique_${p === 8 ? 7 : p}.png`}')

old_names_1 = '["Under 8%", "8–12%", "12–15%", "15–20%", "20–25%", "25–30%", "30–40%"]'
new_names_1 = '["Under 8%", "8–12%", "12–15%", "15–20%", "20–25%", "25–30%", "30–40%", "Above 40%"]'

old_names_2 = '["Essential fat", "Athletic", "Fit", "Average fit", "Average", "Above average", "High body fat"]'
new_names_2 = '["Essential fat", "Athletic", "Fit", "Average fit", "Average", "Above average", "High body fat", "Obese"]'

content = content.replace(old_names_1, new_names_1)
content = content.replace(old_names_2, new_names_2)

with open('src/features/onboarding/pages/OnboardingPage.tsx', 'w') as f:
    f.write(content)
