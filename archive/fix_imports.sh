sed -i 's/import { useAppStore } from "..\/store";/import { useAppStore } from "..\/store";\nimport { useStreaks } from "..\/hooks\/useStreaks";\nimport { reportService } from "..\/services\/reportService";/g' src/screens/CalorieDetail.tsx
sed -i 's/import { useAppStore } from "..\/store";/import { useAppStore } from "..\/store";\nimport { useStreaks } from "..\/hooks\/useStreaks";\nimport { reportService } from "..\/services\/reportService";/g' src/screens/ProteinDetail.tsx
sed -i 's/import { toUtcDayNumber } from "..\/store";/import { toUtcDayNumber } from "..\/lib\/streaks";/g' src/screens/CalorieDetail.tsx
sed -i 's/import { toUtcDayNumber } from "..\/store";/import { toUtcDayNumber } from "..\/lib\/streaks";/g' src/screens/ProteinDetail.tsx
sed -i 's/const { onboardingData } =/const { onboardingData } = useAppStore();\n  const {} =/g' src/screens/CalorieDetail.tsx
sed -i 's/const { onboardingData } =/const { onboardingData } = useAppStore();\n  const {} =/g' src/screens/ProteinDetail.tsx
sed -i '/const {} =/d' src/screens/CalorieDetail.tsx
sed -i '/const {} =/d' src/screens/ProteinDetail.tsx
