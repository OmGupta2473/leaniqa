const fs = require('fs');
let content = fs.readFileSync('src/router/layouts/AppLayout.tsx', 'utf8');

// import React, { Profiler } from 'react';
// import { onRenderCallback, useRenderTracker } from '@/shared/utils/perfDebug';

content = `import React, { Profiler } from 'react';\nimport { onRenderCallback, useRenderTracker } from '@/shared/utils/perfDebug';\n` + content;

content = content.replace('export function AppLayout({ children }: AppLayoutProps) {', `export function AppLayout({ children }: AppLayoutProps) {
  useRenderTracker('AppLayout');`);

content = content.replace('return (', `return (
    <Profiler id="AppLayout" onRender={onRenderCallback}>`);
content = content.replace('  );', `  </Profiler>\n  );`);

fs.writeFileSync('src/router/layouts/AppLayout.tsx', content);
