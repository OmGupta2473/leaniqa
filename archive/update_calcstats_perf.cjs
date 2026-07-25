const fs = require('fs');
let content = fs.readFileSync('src/shared/utils/profileCalculations.ts', 'utf8');

content = content.replace('export function calculateMacros(weightKg: number, heightCm: number, age: number, gender: string, activityLevel: string) {', `export function calculateMacros(weightKg: number, heightCm: number, age: number, gender: string, activityLevel: string) {
  if (import.meta.env.DEV) console.time('[PERF] calculateMacros');`);

content = content.replace('  return {\n    tdee,', `  if (import.meta.env.DEV) console.timeEnd('[PERF] calculateMacros');\n  return {\n    tdee,`);

content = content.replace('export function calculateGoalStats(tdee: number, weightKg: number, currentBf: number, targetBf: number, deficitKcal: number) {', `export function calculateGoalStats(tdee: number, weightKg: number, currentBf: number, targetBf: number, deficitKcal: number) {
  if (import.meta.env.DEV) console.time('[PERF] calculateGoalStats');`);

content = content.replace('  return {\n    fatToLoseKg: fatToLoseKg.toFixed(1),', `  if (import.meta.env.DEV) console.timeEnd('[PERF] calculateGoalStats');\n  return {\n    fatToLoseKg: fatToLoseKg.toFixed(1),`);

fs.writeFileSync('src/shared/utils/profileCalculations.ts', content);
