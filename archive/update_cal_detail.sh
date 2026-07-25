sed -i 's/const { dailyLogs, calorieStreak, earnedAwards, onboardingData } =/const { onboardingData } = useAppStore();\n  const { data: metrics = [] } = useQuery({ queryKey: ["dailyMetrics"], queryFn: () => reportService.getDailyMetrics() });\n  const { calorieStreak, earnedAwards } = useStreaks();\n  const {} =/g' src/screens/CalorieDetail.tsx
sed -i '/useAppStore();/d' src/screens/CalorieDetail.tsx
sed -i 's/dailyLogs/metrics/g' src/screens/CalorieDetail.tsx
sed -i 's/import { useAppStore } from "..\/store";/import { useAppStore } from "..\/store";\nimport { useStreaks } from "..\/hooks\/useStreaks";\nimport { reportService } from "..\/services\/reportService";/g' src/screens/CalorieDetail.tsx
