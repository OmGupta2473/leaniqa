import { readFileSync, writeFileSync } from 'fs';

let p = readFileSync('src/app/App.tsx', 'utf8');
p = p.replace(
  'import { AppRouter } from \'@/router\';',
  'import { AppRouter } from \'./router\';'
);
p = p.replace(
  'import { AppRouter } from \'@/app/router\';',
  'import { AppRouter } from \'./router\';'
);
writeFileSync('src/app/App.tsx', p);

