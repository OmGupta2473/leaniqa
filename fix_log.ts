import { readFileSync, writeFileSync } from 'fs';

let c = readFileSync('src/features/nutrition/pages/MealLoggerPage.tsx', 'utf8');

c = c.replace(
  `<span className="text-[8.5px] bg-[rgba(255,184,77,0.12)] text-[#FFB84D] px-1.5 py-0.5 font-bold rounded-full tracking-wide whitespace-nowrap">{m.fiber || 0}G FIB</span>`,
  ``
);

writeFileSync('src/features/nutrition/pages/MealLoggerPage.tsx', c);
