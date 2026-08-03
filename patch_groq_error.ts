import { readFileSync, writeFileSync } from 'fs';

const file = 'supabase/functions/parse-meal/index.ts';
let code = readFileSync(file, 'utf8');

const regex = /if \(!context\.groqApiKey\) return null;/;
const newCode = `if (!context.groqApiKey) {
      console.error("[parse-meal] GROQ_API_KEY is missing from environment variables.");
      throw new Error("Server configuration error: GROQ_API_KEY is not configured. Please add it to Supabase Dashboard -> Edge Functions -> Secrets.");
    }`;

code = code.replace(regex, newCode);
writeFileSync(file, code);
