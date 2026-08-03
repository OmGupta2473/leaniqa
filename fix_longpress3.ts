import { readFileSync, writeFileSync } from 'fs';
let c = readFileSync('src/shared/hooks/useLongPress.ts', 'utf8');

c = c.replace(
  '{ shouldPreventDefault = true, delay = 500 } = {}',
  '{ shouldPreventDefault = true, delay = 500 }: { shouldPreventDefault?: boolean; delay?: number; } = {}'
);

writeFileSync('src/shared/hooks/useLongPress.ts', c);
