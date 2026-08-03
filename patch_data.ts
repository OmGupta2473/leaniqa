import { readFileSync, writeFileSync } from 'fs';

const file = 'src/features/nutrition/constants/data.ts';
let code = readFileSync(file, 'utf8');

const regex = /export function extractQuantityAndFood[\s\S]*?return null;\n\}/m;
const newCode = `export function extractQuantityAndFood(text: string): { quantity: number; unit: string; foodKey: string } | null {
  const normalized = text.toLowerCase().trim();
  
  // Patterns: "2 eggs", "100g chicken", "1.5 cups rice", "3 rotis", "chicken 200g"
  const patterns = [
    { regex: /^(\\d+(?:\\.\\d+)?)\\s*(grams?|gm?|g)\\s+(.+)$/, qtyIdx: 1, unitIdx: 2, foodIdx: 3 },
    { regex: /^(\\d+(?:\\.\\d+)?)\\s*(ml|milliliters?)\\s+(.+)$/, qtyIdx: 1, unitIdx: 2, foodIdx: 3 },
    { regex: /^(\\d+(?:\\.\\d+)?)\\s*(cups?|bowls?)\\s+(.+)$/, qtyIdx: 1, unitIdx: 2, foodIdx: 3 },
    { regex: /^(\\d+(?:\\.\\d+)?)\\s+(.+)$/, qtyIdx: 1, unitIdx: null, foodIdx: 2 },
    { regex: /^(.+?)\\s+(\\d+(?:\\.\\d+)?)\\s*(g|grams?|gm)$/, qtyIdx: 2, unitIdx: 3, foodIdx: 1 },
  ];
  
  for (const pattern of patterns) {
    const match = normalized.match(pattern.regex);
    if (match) {
      const qty = parseFloat(match[pattern.qtyIdx]);
      const food = match[pattern.foodIdx].trim();
      let unit = 'count';
      if (pattern.unitIdx !== null) {
          const rawUnit = match[pattern.unitIdx].toLowerCase();
          if (rawUnit.startsWith('g')) unit = 'g';
          else if (rawUnit.startsWith('m')) unit = 'ml';
          else if (rawUnit.startsWith('c')) unit = 'cup';
          else if (rawUnit.startsWith('b')) unit = 'bowl';
      }
      if (food && qty > 0) {
        return { quantity: qty, unit, foodKey: food };
      }
    }
  }
  
  return null;
}`;

code = code.replace(regex, newCode);
writeFileSync(file, code);
