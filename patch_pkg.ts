import { readFileSync, writeFileSync } from 'fs';

const file = 'package.json';
let pkg = JSON.parse(readFileSync(file, 'utf8'));

pkg.scripts.dev = "tsx server.ts";
pkg.scripts.build = "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs";
pkg.scripts.start = "node dist/server.cjs";

writeFileSync(file, JSON.stringify(pkg, null, 2));
