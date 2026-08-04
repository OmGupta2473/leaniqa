import { readFileSync, writeFileSync } from 'fs';

const file = 'supabase/functions/parse-meal/index.ts';
let code = readFileSync(file, 'utf8');

const target1 = `    let data: MealResult | null = null;
    let parserUsed = '';`;
const replacement1 = `    let data: MealResult | null = null;
    let parserUsed = '';
    let lastError = '';`;

const target2 = `        if (err.message?.includes("Server configuration error")) {
          throw err;
        }
        data = null;`;
const replacement2 = `        if (err.message?.includes("Server configuration error")) {
          throw err;
        }
        lastError = err.message || String(err);
        data = null;`;

const target3 = `    if (!data) {
      throw new Error("All AI parsing stages failed completely");
    }`;
const replacement3 = `    if (!data) {
      throw new Error("AI parsing failed. Details: " + lastError);
    }`;

code = code.replace(target1, replacement1);
code = code.replace(target2, replacement2);
code = code.replace(target3, replacement3);

// Fix the JSON parse error as well just in case
const jsonTarget = `      const parsed = JSON.parse(content);
      const data = MealSchema.parse(parsed);`;
const jsonReplacement = `      let parsed;
      try {
        const jsonMatch = content.match(/\\{[\\s\\S]*\\}/);
        if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
        } else {
            parsed = JSON.parse(content);
        }
      } catch (e) {
          throw new Error("Failed to parse Groq JSON: " + content);
      }
      const data = MealSchema.parse(parsed);`;
code = code.replace(jsonTarget, jsonReplacement);

writeFileSync(file, code);
