const fs = require('fs');
let content = fs.readFileSync('src/features/goal/pages/GoalSetterPage.tsx', 'utf8');

if (!content.includes('</Profiler>')) {
    content = content.replace(/    <\/motion.div>\n  \);\n}/, `    </motion.div>\n    </Profiler>\n  );\n}`);
    fs.writeFileSync('src/features/goal/pages/GoalSetterPage.tsx', content);
}
