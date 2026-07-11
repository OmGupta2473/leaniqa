const fs = require('fs');
let content = fs.readFileSync('src/features/dashboard/pages/DashboardPage.tsx', 'utf8');

if (!content.includes('</Profiler>')) {
  // Find the last return (...) in the file and wrap it with Profiler
  const match = content.match(/return \(\s*<div/);
  if (match) {
    content = content.replace(match[0], `return (\n    <Profiler id="DashboardPage" onRender={onRenderCallback}>\n      <div`);
    // Find the last </div>  ); and replace it
    content = content.replace(/    <\/div>\n  \);\n}/, `    </div>\n    </Profiler>\n  );\n}`);
    fs.writeFileSync('src/features/dashboard/pages/DashboardPage.tsx', content);
  }
}
