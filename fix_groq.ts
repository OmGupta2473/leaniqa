import { readFileSync, writeFileSync } from 'fs';

let c = readFileSync('supabase/functions/parse-meal/index.ts', 'utf8');

c = c.replace(
  `Analyze this meal: "\${context.originalText}". Meal type: \${context.mealType}. Generate structured JSON only. Never generate conversational text or markdown blocks.`,
  `Analyze this meal: "\${context.originalText}". Meal type: \${context.mealType}. Always return fiber (in grams) as a core macronutrient in the JSON. Generate structured JSON only. Never generate conversational text or markdown blocks.`
);

writeFileSync('supabase/functions/parse-meal/index.ts', c);
