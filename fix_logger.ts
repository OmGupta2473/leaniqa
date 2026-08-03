import { readFileSync, writeFileSync, existsSync } from 'fs';

if (existsSync('src/main.tsx')) {
    let m = readFileSync('src/main.tsx', 'utf8');
    m = m.replace('import "@/shared/utils/logger";\n', '');
    m = m.replace('import "@/shared/utils/logger";', '');
    writeFileSync('src/main.tsx', m);
}

