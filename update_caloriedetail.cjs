const fs = require('fs');
const content = `import { useNavigate } from "react-router-dom";
import React, { useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { profileService } from "@/features/profile/services/profileService";
import { mealService } from "../services/mealService";
import { useCalculatedProfile } from "@/shared/hooks/useCalculatedProfile";
import { useUserStore } from "@/features/profile/store/userStore";
import { reportService } from "@/features/reports/services/reportService";
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from "recharts";
import { ChevronLeft } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/shared/utils/utils";

function getLocalDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return \`\${year}-\${month}-\${day}\`;
}

export function CalorieDetailPage() {
  const navigate = useNavigate();
  const { profileData: onboardingData } = useCalculatedProfile();
  const { data: metrics = [] } = useQuery({ queryKey: ["dailyMetrics"], queryFn: () => reportService.getDailyMetrics() });
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileService.getProfile(),
  });
  const { data: goal } = useQuery({
    queryKey: ["goal"],
    queryFn: () => profileService.getGoal(),
  });
  const { data: meals = [] } = useQuery({
    queryKey: ["meals", "today"],
    queryFn: () => mealService.getTodaysMeals(),
  });

  const dailyCalorieGoal =
    profile?.maintenance_kcal && goal?.deficit_kcal !== undefined
      ? profile.maintenance_kcal - goal.deficit_kcal
      : (onboardingData?.dailyCalorieGoal ?? 2000);

  const todayStr = getLocalDateString();
  const caloriesConsumed = meals ? meals.reduce((acc, m) => acc + m.calories, 0) : 0;
  
  const chartLogs = useMemo(() => {
    const logs = [...metrics];
    const todayIdx = logs.findIndex(l => l.date === todayStr);
    if (todayIdx >= 0) {
      logs[todayIdx] = { ...logs[todayIdx], actual_calories: caloriesConsumed, target_calories: dailyCalorieGoal };
    } else {
      logs.push({
        date: todayStr,
        actual_calories: caloriesConsumed,
        actual_protein: 0, user_id: "", water: 0, score: 0,
        target_calories: dailyCalorieGoal,
        target_protein: 0,
      });
    }
    // Take last 7 days
    const recentLogs = logs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-7);
    return recentLogs;
  }, [metrics, todayStr, caloriesConsumed, dailyCalorieGoal]);

  const chartData = useMemo(() => {
    return chartLogs.map(l => {
      const d = new Date(l.date);
      const isToday = l.date === todayStr;
      return {
        date: l.date,
        dayLabel: isToday ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }),
        actual: l.actual_calories,
        isToday
      };
    });
  }, [chartLogs, todayStr]);

  const breakfastKcal = meals.filter(m => m.meal_slot === 'breakfast').reduce((a, b) => a + b.calories, 0);
  const lunchKcal = meals.filter(m => m.meal_slot === 'lunch').reduce((a, b) => a + b.calories, 0);
  const dinnerKcal = meals.filter(m => m.meal_slot === 'dinner').reduce((a, b) => a + b.calories, 0);
  const otherKcal = meals.filter(m => !['breakfast', 'lunch', 'dinner'].includes(m.meal_slot || '')).reduce((a, b) => a + b.calories, 0);

  return (
    <div className="page-enter pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(100px+env(safe-area-inset-bottom))] min-h-[100dvh] bg-[#0A0A0A] px-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate("/dashboard")} className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center">
          <ChevronLeft size={20} className="text-white" />
        </button>
        <h1 className="text-[17px] font-semibold text-white tracking-tight">Calories</h1>
        <div className="w-8" />
      </div>

      {/* Hero Number Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center text-center mb-10 mt-4">
        <div className="text-[12px] uppercase tracking-widest font-semibold text-[rgba(255,255,255,0.4)] mb-2">Total consumed</div>
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className="text-[54px] font-bold text-[#D4FF00] tracking-[-1.5px] leading-none">{caloriesConsumed}</span>
          <span className="text-[18px] text-[rgba(255,255,255,0.6)] font-medium">kcal</span>
        </div>
        <div className="text-[14px] text-white font-medium mt-1">/ {dailyCalorieGoal} daily target</div>
      </motion.div>

      {/* 7-Day History Chart */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-base p-5 mb-8">
        <div className="text-[14px] font-semibold text-white mb-6">7-Day History</div>
        <div className="h-[160px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis 
                dataKey="dayLabel" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} 
                dy={10} 
              />
              <Bar dataKey="actual" radius={[4, 4, 4, 4]} maxBarSize={32}>
                {chartData.map((entry, index) => (
                  <Cell key={\`cell-\${index}\`} fill={entry.isToday ? '#D4FF00' : 'rgba(255,255,255,0.15)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Meal Breakdown Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="text-[18px] font-semibold text-white mb-4">Today's Meals</div>
        
        {meals.length === 0 ? (
          <div className="text-[14px] text-[rgba(255,255,255,0.3)] text-center py-8 italic">No meals logged yet today</div>
        ) : (
          <div className="card-base p-4">
            <div className="flex items-center justify-between py-3 border-b border-[rgba(255,255,255,0.06)]">
              <span className="text-[15px] font-medium text-white">Breakfast</span>
              <span className="text-[15px] font-bold text-white">{breakfastKcal} <span className="text-[12px] font-normal text-[rgba(255,255,255,0.4)]">kcal</span></span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[rgba(255,255,255,0.06)]">
              <span className="text-[15px] font-medium text-white">Lunch</span>
              <span className="text-[15px] font-bold text-white">{lunchKcal} <span className="text-[12px] font-normal text-[rgba(255,255,255,0.4)]">kcal</span></span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[rgba(255,255,255,0.06)]">
              <span className="text-[15px] font-medium text-white">Dinner</span>
              <span className="text-[15px] font-bold text-white">{dinnerKcal} <span className="text-[12px] font-normal text-[rgba(255,255,255,0.4)]">kcal</span></span>
            </div>
            {otherKcal > 0 && (
              <div className="flex items-center justify-between py-3">
                <span className="text-[15px] font-medium text-white">Snacks / Other</span>
                <span className="text-[15px] font-bold text-white">{otherKcal} <span className="text-[12px] font-normal text-[rgba(255,255,255,0.4)]">kcal</span></span>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
`
fs.writeFileSync('src/features/nutrition/pages/CalorieDetailPage.tsx', content);
