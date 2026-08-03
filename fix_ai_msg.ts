import { readFileSync, writeFileSync } from 'fs';

let c = readFileSync('src/features/nutrition/pages/MealLoggerPage.tsx', 'utf8');

c = c.replace(
  `<span className="text-[10px] bg-[rgba(255,255,255,0.1)] text-[rgba(235,235,245,0.6)] px-2 py-0.5 rounded-full font-semibold">{msg.data.carbs}g carb</span>`,
  `<span className="text-[10px] bg-[rgba(255,255,255,0.1)] text-[rgba(235,235,245,0.6)] px-2 py-0.5 rounded-full font-semibold">{msg.data.carbs}g carb</span>
                            <span className="text-[10px] bg-[rgba(255,184,77,0.12)] text-[#FFB84D] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{msg.data.fiber || 0}g fib</span>`
);

c = c.replace(
  `<span className="text-[10px] bg-[rgba(255,255,255,0.1)] text-[rgba(235,235,245,0.6)] px-2 py-0.5 rounded-full font-semibold">{pendingMeal.data.carbs}g carb</span>`,
  `<span className="text-[10px] bg-[rgba(255,255,255,0.1)] text-[rgba(235,235,245,0.6)] px-2 py-0.5 rounded-full font-semibold">{pendingMeal.data.carbs}g carb</span>
                        <span className="text-[10px] bg-[rgba(255,184,77,0.12)] text-[#FFB84D] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{pendingMeal.data.fiber || 0}g fib</span>`
);

writeFileSync('src/features/nutrition/pages/MealLoggerPage.tsx', c);
