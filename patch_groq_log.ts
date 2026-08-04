import { readFileSync, writeFileSync } from 'fs';

const file = 'supabase/functions/parse-meal/index.ts';
let code = readFileSync(file, 'utf8');

const target = `      if (!res.ok) {
        throw new Error(\`Groq API Error: \${res.status}\`);
      }`;

const replacement = `      if (!res.ok) {
        const errText = await res.text();
        throw new Error(\`Groq API Error \${res.status}: \${errText}\`);
      }`;

code = code.replace(target, replacement);
writeFileSync(file, code);
