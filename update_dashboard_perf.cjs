const fs = require('fs');
let content = fs.readFileSync('src/features/dashboard/pages/DashboardPage.tsx', 'utf8');

content = `import React, { Profiler } from 'react';\nimport { onRenderCallback, useRenderTracker, useHeavyEffectTracker } from '@/shared/utils/perfDebug';\n` + content;

content = content.replace('export function DashboardPage() {', `export function DashboardPage() {
  useRenderTracker('DashboardPage');`);

content = content.replace('return (', `return (
    <Profiler id="DashboardPage" onRender={onRenderCallback}>`);
content = content.replace(/  \);\n}$/, `  </Profiler>\n  );\n}`);

fs.writeFileSync('src/features/dashboard/pages/DashboardPage.tsx', content);
