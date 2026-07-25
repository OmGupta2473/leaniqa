const fs = require('fs');
let content = fs.readFileSync('src/features/reports/pages/WeeklyReportPage.tsx', 'utf8');

content = `import React, { Profiler } from 'react';\nimport { onRenderCallback, useRenderTracker } from '@/shared/utils/perfDebug';\n` + content;

content = content.replace('export function WeeklyReportPage() {', `export function WeeklyReportPage() {
  useRenderTracker('WeeklyReportPage');`);

content = content.replace(/return \(\s*<div/, `return (\n    <Profiler id="WeeklyReportPage" onRender={onRenderCallback}>\n      <div`);
// Replace last </div>
content = content.replace(/    <\/div>\n  \);\n}/, `    </div>\n    </Profiler>\n  );\n}`);

fs.writeFileSync('src/features/reports/pages/WeeklyReportPage.tsx', content);
