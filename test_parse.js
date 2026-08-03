const fs = require('fs');
const content = fs.readFileSync('src/features/dashboard/pages/DashboardPage.tsx', 'utf8');
const lines = content.split('\n');
for (let i = 320; i <= 360; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
