sed -i 's/log.calorieUnderTarget/log.actual_calories <= log.target_calories \&\& log.actual_calories > 0/g' src/screens/CalorieDetail.tsx
sed -i 's/log.proteinHitTarget/log.actual_protein >= log.target_protein \&\& log.actual_protein > 0/g' src/screens/ProteinDetail.tsx
sed -i 's/proteinTarget/target_protein/g' src/screens/ProteinDetail.tsx
sed -i 's/actual_protein: 0,/actual_protein: 0, user_id: "", water: 0, score: 0,/g' src/screens/CalorieDetail.tsx
sed -i 's/actual_calories: 0,/actual_calories: 0, user_id: "", water: 0, score: 0,/g' src/screens/ProteinDetail.tsx
