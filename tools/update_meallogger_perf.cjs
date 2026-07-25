const fs = require('fs');
let content = fs.readFileSync('src/features/nutrition/pages/MealLoggerPage.tsx', 'utf8');

content = `import React, { Profiler } from 'react';\nimport { onRenderCallback, useRenderTracker } from '@/shared/utils/perfDebug';\n` + content;

content = content.replace('export function MealLoggerPage() {', `export function MealLoggerPage() {
  useRenderTracker('MealLoggerPage');`);

content = content.replace(/return \(\s*<div/, `return (\n    <Profiler id="MealLoggerPage" onRender={onRenderCallback}>\n      <div`);
content = content.replace(/    <\/div>\n  \);\n}/, `    </div>\n    </Profiler>\n  );\n}`);

fs.writeFileSync('src/features/nutrition/pages/MealLoggerPage.tsx', content);
