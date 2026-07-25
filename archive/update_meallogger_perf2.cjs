const fs = require('fs');
let content = fs.readFileSync('src/features/nutrition/pages/MealLoggerPage.tsx', 'utf8');

if (!content.includes('</Profiler>')) {
    content = content.replace(/return \(\s*<>/, `return (\n    <Profiler id="MealLoggerPage" onRender={onRenderCallback}>\n      <>`);
    content = content.replace(/    <\/>\n  \);\n}/, `    </>\n    </Profiler>\n  );\n}`);
    fs.writeFileSync('src/features/nutrition/pages/MealLoggerPage.tsx', content);
}
