sed -i 's/actual_protein: actual_protein: proteinConsumed/actual_protein: proteinConsumed/g' src/screens/ProteinDetail.tsx
sed -i 's/\[metrics, todayStr, actual_protein: proteinConsumed, proteinTarget, isTargetHit\]/\[metrics, todayStr, proteinConsumed, proteinTarget, isTargetHit\]/g' src/screens/ProteinDetail.tsx
sed -i 's/logs\[todayIdx\] = { ...logs\[todayIdx\], actual_protein: proteinConsumed, proteinHitTarget: isTargetHit };/logs\[todayIdx\] = { ...logs\[todayIdx\], actual_protein: proteinConsumed, target_protein: proteinTarget };/g' src/screens/ProteinDetail.tsx
sed -i 's/caloriesConsumed: 0,/actual_calories: 0,/g' src/screens/ProteinDetail.tsx
sed -i 's/calorieTarget: 0,/target_calories: 0,/g' src/screens/ProteinDetail.tsx
sed -i 's/proteinTarget,/target_protein: proteinTarget,/g' src/screens/ProteinDetail.tsx
sed -i '/calorieUnderTarget: false,/d' src/screens/ProteinDetail.tsx
sed -i '/proteinHitTarget: isTargetHit,/d' src/screens/ProteinDetail.tsx
