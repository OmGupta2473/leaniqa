import { readFileSync, writeFileSync } from 'fs';

let p = readFileSync('src/app/App.tsx', 'utf8');
p = p.replace(
  'import { router } from \'@/router\';',
  'import { router } from \'./router\';'
);
writeFileSync('src/app/App.tsx', p);

