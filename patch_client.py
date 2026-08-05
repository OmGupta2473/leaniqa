import re

with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'r') as f:
    content = f.read()

old_fetch = """            const response = await fetch('/api/parse-meal', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                text, 
                remainingCalories, 
                remainingProtein, 
                mealType: selectedMealSlot, 
                userGoal: onboardingData?.goal 
              })
            });"""

new_fetch = """            const url = new URL('/api/parse-meal', window.location.href);
            if (text) url.searchParams.set('text', text);
            if (remainingCalories !== undefined) url.searchParams.set('remainingCalories', remainingCalories.toString());
            if (remainingProtein !== undefined) url.searchParams.set('remainingProtein', remainingProtein.toString());
            if (selectedMealSlot) url.searchParams.set('mealType', selectedMealSlot);
            if (onboardingData?.goal) url.searchParams.set('userGoal', onboardingData.goal);
            
            const response = await fetch(url.toString(), {
              method: 'GET',
              credentials: 'include'
            });"""

if old_fetch in content:
    content = content.replace(old_fetch, new_fetch)
    print("Patched fetch successfully.")
else:
    print("Could not find old fetch block.")

with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'w') as f:
    f.write(content)

