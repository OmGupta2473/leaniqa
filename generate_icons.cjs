const sharp = require('sharp');
const fs = require('fs');

async function main() {
  const svgBuffer = fs.readFileSync('public/favicon.svg');
  
  // 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile('public/pwa-192x192.png');
    
  // 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile('public/pwa-512x512.png');
    
  // maskable-512x512 (more padding by changing viewBox temporarily or padding with sharp)
  const maskableSvg = fs.readFileSync('public/favicon.svg', 'utf8')
    .replace('viewBox="105 90 220 220"', 'viewBox="85 70 260 260"');
    
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile('public/maskable-512x512.png');
    
  // also update logo.png (optional but might be nice)
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile('public/logo.png');

  console.log('Icons generated successfully.');
}

main().catch(console.error);
