import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const SRC_APP = resolve(root, 'public/icon-app.svg');
const SRC_MASKABLE = resolve(root, 'public/icon-maskable.svg');
const OUT_DIR = resolve(root, 'public');
const OUT_ICONS = resolve(root, 'public/icons');

const TARGETS = [
  { src: SRC_APP,      dest: resolve(OUT_DIR, 'LQ-64.png'),              size: 64 },
  { src: SRC_APP,      dest: resolve(OUT_DIR, 'LQ-192.png'),             size: 192 },
  { src: SRC_APP,      dest: resolve(OUT_DIR, 'logo.png'),               size: 512 },
  { src: SRC_MASKABLE, dest: resolve(OUT_ICONS, 'maskable-512.png'),     size: 512 },
];

async function main() {
  mkdirSync(OUT_ICONS, { recursive: true });
  for (const { src, dest, size } of TARGETS) {
    await sharp(src).resize(size, size).png({ compressionLevel: 9 }).toFile(dest);
    console.log(`  wrote ${dest.replace(root + '/', '')} (${size}x${size})`);
  }
  console.log('Icons regenerated from SVG sources.');
}

main().catch((err) => {
  console.error('Icon generation failed:', err);
  process.exit(1);
});