sed -i 's/day.calorieUnderTarget/(day.actual_calories <= day.target_calories \&\& day.actual_calories > 0)/g' src/screens/CalorieDetail.tsx
sed -i 's/day.proteinHitTarget/(day.actual_protein >= day.target_protein \&\& day.actual_protein > 0)/g' src/screens/ProteinDetail.tsx
