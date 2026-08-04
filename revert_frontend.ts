import { readFileSync, writeFileSync } from 'fs';

const file = 'src/features/nutrition/pages/MealLoggerPage.tsx';
let code = readFileSync(file, 'utf8');

const target = `            // Call local Express API for parsing instead of Edge Function
            const res = await fetch('/api/parse-meal', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text, remainingCalories, remainingProtein, mealType: selectedMealSlot, userGoal: calculatedProfile.goal })
            });
            let data = null;
            let error = null;
            if (res.ok) {
              data = await res.json();
            } else {
              const errData = await res.json().catch(() => ({}));
              error = new Error(errData.error || 'Failed to parse meal via API');
            }`;

const replacement = `            const { data, error } = await supabase.functions.invoke('parse-meal', { body: { text, remainingCalories, remainingProtein, mealType: selectedMealSlot }, headers: { Authorization: \`Bearer \${currentSession.access_token}\` } });`;

code = code.replace(target, replacement);
writeFileSync(file, code);
