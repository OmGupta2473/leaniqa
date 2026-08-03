import { readFileSync, writeFileSync } from 'fs';

let c = readFileSync('src/features/nutrition/pages/MealLoggerPage.tsx', 'utf8');

c = c.replace(
  /<div className="flex justify-between items-center mt-5 pt-4 border-t border-\[rgba\(255,255,255,0\.06\)\] px-1">/g,
  `<div className="grid grid-cols-5 gap-1 items-center mt-5 pt-4 border-t border-[rgba(255,255,255,0.06)] px-1">`
);

writeFileSync('src/features/nutrition/pages/MealLoggerPage.tsx', c);
