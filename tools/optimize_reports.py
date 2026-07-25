import re

with open('src/features/reports/pages/WeeklyReportPage.tsx', 'r') as f:
    content = f.read()

if 'useMemo' not in content:
    content = content.replace("import { useQuery } from '@tanstack/react-query';", "import { useQuery } from '@tanstack/react-query';\nimport { useMemo } from 'react';")

old_stats = """  const todayStats = () => {
    const todayStr = getLocalDateString();
    const todaysMeals = meals.filter(m => m.meal_time.startsWith(todayStr));
    
    // Process hourly...
    const hourlyCalories = Array(24).fill(0);
    todaysMeals.forEach(m => {
      const h = new Date(m.meal_time).getHours();
      hourlyCalories[h] += m.calories;
    });

    return {
      caloriesConsumed: todaysMeals.reduce((a, m) => a + m.calories, 0),
      calorieTarget: (profile?.maintenance_kcal || 2200) - (goal?.deficit_kcal || 400),
      proteinConsumed: todaysMeals.reduce((a, m) => a + m.protein, 0),
      proteinTarget: profile?.protein_target || 150,
      fatConsumed: todaysMeals.reduce((a, m) => a + m.fat, 0),
      fatTarget: 70, // static for now
      carbsConsumed: todaysMeals.reduce((a, m) => a + m.carbs, 0),
      carbsTarget: 250, // static for now
      hourlyCalories
    };
  };"""

new_stats = """  const todayStats = useMemo(() => {
    const todayStr = getLocalDateString();
    const todaysMeals = meals.filter(m => m.meal_time.startsWith(todayStr));
    
    // Process hourly...
    const hourlyCalories = Array(24).fill(0);
    todaysMeals.forEach(m => {
      const h = new Date(m.meal_time).getHours();
      hourlyCalories[h] += m.calories;
    });

    return {
      caloriesConsumed: todaysMeals.reduce((a, m) => a + m.calories, 0),
      calorieTarget: (profile?.maintenance_kcal || 2200) - (goal?.deficit_kcal || 400),
      proteinConsumed: todaysMeals.reduce((a, m) => a + m.protein, 0),
      proteinTarget: profile?.protein_target || 150,
      fatConsumed: todaysMeals.reduce((a, m) => a + m.fat, 0),
      fatTarget: 70, // static for now
      carbsConsumed: todaysMeals.reduce((a, m) => a + m.carbs, 0),
      carbsTarget: 250, // static for now
      hourlyCalories
    };
  }, [meals, profile, goal]);"""

old_last7 = """  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayMeals = meals.filter(m => m.meal_time.startsWith(dateStr));
    const dayMetric = dailyMetrics.find(m => m.date === dateStr);
    
    return {
      date: dateStr,
      caloriesConsumed: dayMeals.reduce((a, m) => a + m.calories, 0),
      calorieTarget: dayMetric?.target_calories || ((profile?.maintenance_kcal || 2200) - (goal?.deficit_kcal || 400)),
      proteinConsumed: dayMeals.reduce((a, m) => a + m.protein, 0),
      proteinTarget: dayMetric?.target_protein || (profile?.protein_target || 150),
      fatConsumed: dayMeals.reduce((a, m) => a + m.fat, 0),
      carbsConsumed: dayMeals.reduce((a, m) => a + m.carbs, 0),
      complianceScore: dayMetric?.score || 0
    };
  });"""

new_last7 = """  const last7Days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayMeals = meals.filter(m => m.meal_time.startsWith(dateStr));
    const dayMetric = dailyMetrics.find(m => m.date === dateStr);
    
    return {
      date: dateStr,
      caloriesConsumed: dayMeals.reduce((a, m) => a + m.calories, 0),
      calorieTarget: dayMetric?.target_calories || ((profile?.maintenance_kcal || 2200) - (goal?.deficit_kcal || 400)),
      proteinConsumed: dayMeals.reduce((a, m) => a + m.protein, 0),
      proteinTarget: dayMetric?.target_protein || (profile?.protein_target || 150),
      fatConsumed: dayMeals.reduce((a, m) => a + m.fat, 0),
      carbsConsumed: dayMeals.reduce((a, m) => a + m.carbs, 0),
      complianceScore: dayMetric?.score || 0
    };
  }), [meals, dailyMetrics, profile, goal]);"""

old_calendar = """  const calendarDays = (() => {
    const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const lastDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sun
    
    const days = Array(startingDayOfWeek).fill(null); // padding
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayMeals = meals.filter(m => m.meal_time.startsWith(dateStr));
      const dayMetric = dailyMetrics.find(m => m.date === dateStr);
      
      days.push({
        date: dateStr,
        caloriesConsumed: dayMeals.reduce((a, m) => a + m.calories, 0),
        calorieTarget: dayMetric?.target_calories || ((profile?.maintenance_kcal || 2200) - (goal?.deficit_kcal || 400)),
        proteinConsumed: dayMeals.reduce((a, m) => a + m.protein, 0),
        complianceScore: dayMetric?.score || 0
      });
    }
    return days;
  })();"""

new_calendar = """  const calendarDays = useMemo(() => {
    const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const lastDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sun
    
    const days = Array(startingDayOfWeek).fill(null); // padding
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayMeals = meals.filter(m => m.meal_time.startsWith(dateStr));
      const dayMetric = dailyMetrics.find(m => m.date === dateStr);
      
      days.push({
        date: dateStr,
        caloriesConsumed: dayMeals.reduce((a, m) => a + m.calories, 0),
        calorieTarget: dayMetric?.target_calories || ((profile?.maintenance_kcal || 2200) - (goal?.deficit_kcal || 400)),
        proteinConsumed: dayMeals.reduce((a, m) => a + m.protein, 0),
        complianceScore: dayMetric?.score || 0
      });
    }
    return days;
  }, [calendarMonth, meals, dailyMetrics, profile, goal]);"""

content = content.replace(old_stats, new_stats)
content = content.replace(old_last7, new_last7)
content = content.replace(old_calendar, new_calendar)
content = content.replace("const todayActivity = todayStats();", "const todayActivity = todayStats;")

with open('src/features/reports/pages/WeeklyReportPage.tsx', 'w') as f:
    f.write(content)
