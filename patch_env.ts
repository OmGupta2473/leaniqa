import { readFileSync, writeFileSync } from 'fs';

const file = 'server.ts';
let code = readFileSync(file, 'utf8');

if (!code.includes('dotenv')) {
    code = 'import "dotenv/config";\n' + code;
    writeFileSync(file, code);
}
