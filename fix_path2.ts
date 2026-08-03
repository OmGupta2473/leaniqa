import { readFileSync, writeFileSync } from 'fs';

let p = readFileSync('src/app/providers/AppProvider.tsx', 'utf8');
p = p.replace(
  'import { queryClient } from \'@/app/query/queryClient\';',
  'import { queryClient } from \'../query/queryClient\';'
);
writeFileSync('src/app/providers/AppProvider.tsx', p);
