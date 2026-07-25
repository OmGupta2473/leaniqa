const fs = require('fs');

const path = 'src/features/nutrition/constants/data.ts';
let content = fs.readFileSync(path, 'utf8');

const insertPoint = `  'aloo gobi': { calories: 160, protein: 4, fat: 7, carbs: 20, confidence: 80 },`;
const newEntries = `
  // Indian compound meals (full plate estimates)
  'roti sabji': { calories: 310, protein: 11, fat: 8, carbs: 48, confidence: 80 },
  'roti sabzi': { calories: 310, protein: 11, fat: 8, carbs: 48, confidence: 80 },
  'roti dal': { calories: 360, protein: 16, fat: 6, carbs: 62, confidence: 82 },
  'roti chawal': { calories: 360, protein: 8, fat: 3, carbs: 74, confidence: 78 },
  'egg sabji': { calories: 220, protein: 13, fat: 14, carbs: 8, confidence: 80 },
  'paneer sabji': { calories: 280, protein: 14, fat: 18, carbs: 14, confidence: 80 },
  
  // Extra Indian vegetables (per bowl ~150g)
  'mixed sabji': { calories: 120, protein: 4, fat: 5, carbs: 15, confidence: 72 },
  
  // Extra Snacks
  'marie biscuit': { calories: 42, protein: 0.7, fat: 1, carbs: 7, confidence: 88 },
  'bread butter': { calories: 180, protein: 4, fat: 9, carbs: 22, confidence: 83 },
`;

if (!content.includes('roti sabji')) {
    content = content.replace(insertPoint, insertPoint + newEntries);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Success');
} else {
    console.log('Already updated');
}

