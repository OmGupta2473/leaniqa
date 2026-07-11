const fs = require('fs');
let content = fs.readFileSync('src/shared/components/BottomNav.tsx', 'utf8');

content = `import React, { Profiler } from 'react';\nimport { onRenderCallback, useRenderTracker } from '@/shared/utils/perfDebug';\n` + content;

content = content.replace('export function BottomNav() {', `export function BottomNav() {
  useRenderTracker('BottomNav');`);

content = content.replace(/return \(\s*<div/, `return (\n    <Profiler id="BottomNav" onRender={onRenderCallback}>\n      <div`);
content = content.replace(/    <\/div>\n  \);\n}/, `    </div>\n    </Profiler>\n  );\n}`);

fs.writeFileSync('src/shared/components/BottomNav.tsx', content);
