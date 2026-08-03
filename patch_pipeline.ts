import { readFileSync, writeFileSync } from 'fs';

const file = 'supabase/functions/parse-meal/index.ts';
let code = readFileSync(file, 'utf8');

const regex = /catch \(err: any\) \{\n\s*console\.error\(JSON\.stringify\(\{\n\s*level: "error",\n\s*request_id: requestId,\n\s*stage: name,\n\s*event: "parse_error",\n\s*latency_ms: Date\.now\(\) - pStart,\n\s*error: err\.message \|\| String\(err\)\n\s*\}\)\);\n\s*data = null;\n\s*\}/;

const newCode = `catch (err: any) {
        console.error(JSON.stringify({
          level: "error",
          request_id: requestId,
          stage: name,
          event: "parse_error",
          latency_ms: Date.now() - pStart,
          error: err.message || String(err)
        }));
        if (err.message?.includes("Server configuration error")) {
          throw err;
        }
        data = null;
      }`;

code = code.replace(regex, newCode);
writeFileSync(file, code);
