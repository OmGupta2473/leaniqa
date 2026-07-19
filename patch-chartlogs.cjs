const fs = require('fs');

function patchFile(filepath, metricType) {
  let content = fs.readFileSync(filepath, 'utf8');
  
  const actualField = metricType === 'calorie' ? 'actual_calories' : 'actual_protein';
  const targetField = metricType === 'calorie' ? 'target_calories' : 'target_protein';
  const dailyGoalVar = metricType === 'calorie' ? 'dailyCalorieGoal' : 'target_protein';
  
  const searchPattern = `
    const todayIdx = logs.findIndex(l => l.date === todayStr);`;
    
  const replacement = `
    const logDates = new Set(logs.map(l => l.date));
    Object.keys(mealsByDate).forEach(dateStr => {
      if (!logDates.has(dateStr)) {
        logs.push({
          date: dateStr,
          ${actualField}: mealsByDate[dateStr],
          ${targetField}: ${dailyGoalVar},
          ${metricType === 'calorie' ? 'actual_protein: 0' : 'actual_calories: 0'},
          ${metricType === 'calorie' ? 'target_protein: 0' : 'target_calories: 0'},
          user_id: "", water: 0, score: 0
        });
      }
    });

    const todayIdx = logs.findIndex(l => l.date === todayStr);`;
    
  if (content.includes(searchPattern.trim())) {
    content = content.replace(searchPattern.trim(), replacement.trim());
    fs.writeFileSync(filepath, content);
    console.log(`Patched ${filepath}`);
  } else {
    console.log(`Pattern not found in ${filepath}`);
  }
}

patchFile('src/features/nutrition/pages/CalorieDetailPage.tsx', 'calorie');
patchFile('src/features/nutrition/pages/ProteinDetailPage.tsx', 'protein');
