const fs = require('fs');
let content = fs.readFileSync('src/features/dashboard/pages/DashboardPage.tsx', 'utf8');

content = content.replace('return (\n    <Profiler id="DashboardPage" onRender={onRenderCallback}>) => {', 'return () => {');

fs.writeFileSync('src/features/dashboard/pages/DashboardPage.tsx', content);
