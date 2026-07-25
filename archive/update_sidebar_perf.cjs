const fs = require('fs');
let content = fs.readFileSync('src/shared/components/Sidebar.tsx', 'utf8');

content = `import React, { Profiler } from 'react';\nimport { onRenderCallback, useRenderTracker } from '@/shared/utils/perfDebug';\n` + content;

content = content.replace('export function Sidebar() {', `export function Sidebar() {
  useRenderTracker('Sidebar');`);

content = content.replace(/return \(\s*<div/, `return (\n    <Profiler id="Sidebar" onRender={onRenderCallback}>\n      <div`);
content = content.replace(/    <\/div>\n  \);\n}/, `    </div>\n    </Profiler>\n  );\n}`);

fs.writeFileSync('src/shared/components/Sidebar.tsx', content);
