import { readFileSync, writeFileSync } from 'fs';

let m = readFileSync('src/main.tsx', 'utf8');
m = m.replace(
  'import { devWarn } from \'@/shared/utils/logger\';',
  'import { devWarn } from \'./shared/utils/logger\';'
);
writeFileSync('src/main.tsx', m);
