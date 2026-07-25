const fs = require('fs');
let content = fs.readFileSync('src/shared/components/Header.tsx', 'utf8');

content = `import React, { Profiler } from 'react';\nimport { onRenderCallback, useRenderTracker } from '@/shared/utils/perfDebug';\n` + content;

content = content.replace('export function Header() {', `export function Header() {
  useRenderTracker('Header');`);

content = content.replace(/return \(\s*<header/, `return (\n    <Profiler id="Header" onRender={onRenderCallback}>\n      <header`);
content = content.replace(/    <\/header>\n  \);\n}/, `    </header>\n    </Profiler>\n  );\n}`);

fs.writeFileSync('src/shared/components/Header.tsx', content);
