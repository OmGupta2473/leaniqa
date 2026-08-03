import { readFileSync, writeFileSync } from 'fs';

let c = readFileSync('supabase/functions/parse-meal/index.ts', 'utf8');

c = c.replace(
  /"carbs",\s*"confidence",\s*"foods_detected",\s*"coaching_tip"/g,
  `"carbs",\n              "fiber",\n              "confidence",\n              "foods_detected",\n              "coaching_tip"`
);

writeFileSync('supabase/functions/parse-meal/index.ts', c);
