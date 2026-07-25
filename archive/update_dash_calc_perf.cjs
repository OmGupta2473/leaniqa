const fs = require('fs');
let content = fs.readFileSync('src/features/dashboard/pages/DashboardPage.tsx', 'utf8');

content = content.replace('  const dailyTargetKcal =', `  if (import.meta.env.DEV) console.time('[PERF] Dashboard Calculations');\n  const dailyTargetKcal =`);

content = content.replace('  const streak = calculateCurrentDailyStreak(metrics);', `  const streak = calculateCurrentDailyStreak(metrics);\n  if (import.meta.env.DEV) console.timeEnd('[PERF] Dashboard Calculations');`);

fs.writeFileSync('src/features/dashboard/pages/DashboardPage.tsx', content);
