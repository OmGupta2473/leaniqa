import { readFileSync, writeFileSync } from 'fs';

let p = readFileSync('src/app/App.tsx', 'utf8');
p = p.replace(/@\//g, '../');
writeFileSync('src/app/App.tsx', p);

