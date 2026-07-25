const fs = require('fs');
let content = fs.readFileSync('src/features/goal/pages/GoalSetterPage.tsx', 'utf8');

content = `import React, { Profiler } from 'react';\nimport { onRenderCallback, useRenderTracker } from '@/shared/utils/perfDebug';\n` + content;

content = content.replace('export function GoalSetterPage() {', `export function GoalSetterPage() {
  useRenderTracker('GoalSetterPage');`);

content = content.replace(/return \(\s*<div/, `return (\n    <Profiler id="GoalSetterPage" onRender={onRenderCallback}>\n      <div`);
content = content.replace(/    <\/div>\n  \);\n}/, `    </div>\n    </Profiler>\n  );\n}`);

fs.writeFileSync('src/features/goal/pages/GoalSetterPage.tsx', content);
