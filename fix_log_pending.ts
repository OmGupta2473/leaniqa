import { readFileSync, writeFileSync } from 'fs';

let c = readFileSync('src/features/nutrition/pages/MealLoggerPage.tsx', 'utf8');

c = c.replace(
  /<span className="text-\[10px\] bg-\[rgba\(255,184,77,0\.12\)\] text-\[#FFB84D\] px-2 py-0\.5 rounded-full font-bold uppercase tracking-wider\">\{pendingMeal\.data\.fiber \|\| 0\}g fib<\/span>/g,
  ``
);

writeFileSync('src/features/nutrition/pages/MealLoggerPage.tsx', c);
