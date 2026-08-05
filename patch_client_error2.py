import re

with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'r') as f:
    content = f.read()

old_block = """            const response = await fetch('/api/parse-meal', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'same-origin',
              body: JSON.stringify({ 
                text, 
                remainingCalories, 
                remainingProtein, 
                mealType: selectedMealSlot, 
                userGoal: onboardingData?.goal 
              })
            });
            
            const responseBody = await response.json();"""

new_block = """            const response = await fetch('/api/parse-meal', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ 
                text, 
                remainingCalories, 
                remainingProtein, 
                mealType: selectedMealSlot, 
                userGoal: onboardingData?.goal 
              })
            });
            
            if (response.status === 405 || response.redirected || response.url.includes('__cookie_check')) {
              throw new Error('Preview session expired. Please refresh the page in AI Studio to authenticate.');
            }
            
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
              throw new Error('Preview session expired. Please refresh the page in AI Studio to authenticate.');
            }
            
            const responseBody = await response.json();"""

if old_block in content:
    content = content.replace(old_block, new_block)
    print("Patched client successfully.")
else:
    print("Could not find old block.")

with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'w') as f:
    f.write(content)

