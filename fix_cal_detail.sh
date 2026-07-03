sed -i 's/log.calorieUnderTarget \&\& log.caloriesConsumed > 0/log.actual_calories <= log.target_calories \&\& log.actual_calories > 0/g' src/screens/CalorieDetail.tsx
sed -i 's/caloriesConsumed, calorieUnderTarget: isUnderTarget/actual_calories: caloriesConsumed, target_calories: dailyCalorieGoal/g' src/screens/CalorieDetail.tsx
sed -i 's/caloriesConsumed,/actual_calories: caloriesConsumed,/g' src/screens/CalorieDetail.tsx
sed -i 's/calorieTarget: dailyCalorieGoal,/target_calories: dailyCalorieGoal,/g' src/screens/CalorieDetail.tsx
sed -i 's/d.caloriesConsumed/d.actual_calories/g' src/screens/CalorieDetail.tsx
sed -i 's/day.caloriesConsumed/day.actual_calories/g' src/screens/CalorieDetail.tsx
