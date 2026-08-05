import re

with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'r') as f:
    content = f.read()

# find the fetch block and the try/catch around it
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

            if (!response.ok) {
              throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();"""

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
              throw new Error('Authentication expired. Please reload the page to authenticate.');
            }

            if (!response.ok) {
              throw new Error(`API error: ${response.status}`);
            }

            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
              const data = await response.json();
              if (data.error) throw new Error(data.error);
              
              setParsedMeal(data);
            } else {
              throw new Error('Authentication expired. Please reload the page to authenticate.');
            }"""

# Actually the existing code is slightly different. Let's do a more robust replace using regex
