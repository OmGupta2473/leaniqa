const fs = require('fs');
let content = fs.readFileSync('src/features/nutrition/pages/MealLoggerPage.tsx', 'utf8');

content = content.replace('  const handleSend = useCallback(() => {', `  const handleSend = useCallback(() => {
    if (import.meta.env.DEV) console.time('[PERF] MealLogger handleSend');`);

content = content.replace('      setLoading(false);\n    }\n  },', `      if (import.meta.env.DEV) console.timeEnd('[PERF] MealLogger handleSend');\n      setLoading(false);\n    }\n  },`);

fs.writeFileSync('src/features/nutrition/pages/MealLoggerPage.tsx', content);
