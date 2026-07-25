sed -i 's/const { dailyLogs, proteinStreak, earnedAwards, onboardingData } =/const { onboardingData } = useAppStore();\n  const { data: metrics = [] } = useQuery({ queryKey: ["dailyMetrics"], queryFn: () => reportService.getDailyMetrics() });\n  const { proteinStreak, earnedAwards } = useStreaks();\n  const {} =/g' src/screens/ProteinDetail.tsx
sed -i '/useAppStore();/d' src/screens/ProteinDetail.tsx
sed -i 's/dailyLogs/metrics/g' src/screens/ProteinDetail.tsx
sed -i 's/import { useAppStore } from "..\/store";/import { useAppStore } from "..\/store";\nimport { useStreaks } from "..\/hooks\/useStreaks";\nimport { reportService } from "..\/services\/reportService";/g' src/screens/ProteinDetail.tsx

sed -i 's/log.proteinHitTarget \&\& log.proteinConsumed > 0/log.actual_protein >= log.target_protein \&\& log.actual_protein > 0/g' src/screens/ProteinDetail.tsx
sed -i 's/proteinConsumed, proteinHitTarget: isHit/actual_protein: proteinConsumed, target_protein: dailyProteinGoal/g' src/screens/ProteinDetail.tsx
sed -i 's/proteinConsumed,/actual_protein: proteinConsumed,/g' src/screens/ProteinDetail.tsx
sed -i 's/proteinTarget: dailyProteinGoal,/target_protein: dailyProteinGoal,/g' src/screens/ProteinDetail.tsx
sed -i 's/d.proteinConsumed/d.actual_protein/g' src/screens/ProteinDetail.tsx
sed -i 's/day.proteinConsumed/day.actual_protein/g' src/screens/ProteinDetail.tsx
