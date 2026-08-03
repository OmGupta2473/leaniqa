import { readFileSync, writeFileSync } from 'fs';

let p = readFileSync('src/app/App.tsx', 'utf8');
p = p.replace(
  'import { analytics } from \'@/shared/utils/analytics\';',
  'import { analytics } from \'../shared/utils/analytics\';'
);
writeFileSync('src/app/App.tsx', p);

let f = readFileSync('src/shared/utils/logger.ts', 'utf8');
f = f.replace(/@\//g, '../');
writeFileSync('src/shared/utils/logger.ts', f);

