import { readFileSync, writeFileSync } from 'fs';

let content = readFileSync('src/features/nutrition/pages/MealLoggerPage.tsx', 'utf8');

content = content.replace(
  'const eatenCarbs = meals.reduce((acc, m) => acc + m.carbs, 0);',
  'const eatenCarbs = meals.reduce((acc, m) => acc + m.carbs, 0);\n  const eatenFiber = meals.reduce((acc, m) => acc + (m.fiber || 0), 0);\n  const fiberTarget = profileData?.fiberMin || 20;'
);

writeFileSync('src/features/nutrition/pages/MealLoggerPage.tsx', content);

