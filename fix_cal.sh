sed -i 's/actual_calories: actual_calories: caloriesConsumed/actual_calories: caloriesConsumed/g' src/screens/CalorieDetail.tsx
sed -i 's/\[metrics, todayStr, actual_calories: caloriesConsumed, dailyCalorieGoal, isUnderTarget\]/\[metrics, todayStr, caloriesConsumed, dailyCalorieGoal, isUnderTarget\]/g' src/screens/CalorieDetail.tsx
sed -i 's/proteinConsumed: 0,/actual_protein: 0,/g' src/screens/CalorieDetail.tsx
sed -i 's/proteinTarget: 0,/target_protein: 0,/g' src/screens/CalorieDetail.tsx
sed -i '/calorieUnderTarget: isUnderTarget,/d' src/screens/CalorieDetail.tsx
sed -i '/proteinHitTarget: false,/d' src/screens/CalorieDetail.tsx
