
import { onRenderCallback, useRenderTracker } from '@/shared/utils/perfDebug';
import { useReportStore } from "../store/reportStore";
import React, { useState, useMemo, Profiler } from 'react';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/features/profile/services/profileService';
import { mealService } from '@/features/nutrition/services/mealService';
import { reportService } from '../services/reportService';
import { complianceService } from '../services/complianceService';
import { calculateCurrentDailyStreak, calculateEarnedAwards } from '@/shared/utils/streaks';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { DailyActivityData } from '@/shared/types/activity';
import { cn } from "@/shared/utils/utils";

function getLocalDateString(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function WeeklyReportPage() {
  useRenderTracker('WeeklyReportPage');
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: () => profileService.getProfile() });
  const { data: goal } = useQuery({ queryKey: ['goal'], queryFn: () => profileService.getGoal() });
  const { data: meals = [] } = useQuery({ queryKey: ['meals', 'month'], queryFn: () => mealService.getMeals({ days: 35, limit: 2000 }) });
  const { data: dailyMetrics = [] } = useQuery({ queryKey: ['dailyMetrics'], queryFn: () => reportService.getDailyMetrics() });
  
  const calorieGoal = profile?.maintenance_kcal && goal?.deficit_kcal !== undefined ? profile.maintenance_kcal - goal.deficit_kcal : 2000;
  const proteinGoal = profile?.protein_target || 150;

  const today = new Date();
  
  const last7Days: DailyActivityData[] = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      const dateStr = getLocalDateString(d);
      const dayMeals = meals.filter(m => m.meal_time.startsWith(dateStr));
      const metric = dailyMetrics.find(m => m.date === dateStr);
      return {
        date: dateStr,
        caloriesConsumed: dayMeals.reduce((a, m) => a + m.calories, 0),
        calorieTarget: metric?.target_calories ?? calorieGoal,
        proteinConsumed: dayMeals.reduce((a, m) => a + m.protein, 0),
        proteinTarget: metric?.target_protein ?? proteinGoal,
        fatConsumed: dayMeals.reduce((a, m) => a + m.fat, 0),
        fatTarget: 60,
        carbsConsumed: dayMeals.reduce((a, m) => a + m.carbs, 0),
        carbsTarget: 220,
        complianceScore: metric?.score ?? 0,
      };
    });
  }, [meals, dailyMetrics, calorieGoal, proteinGoal]);

  const loggedDaysCount = last7Days.filter(d => d.caloriesConsumed > 0 || d.complianceScore > 0).length;
  
  const avgCompliance = Math.round(last7Days.reduce((a, b) => a + b.complianceScore, 0) / 7);
  const avgCalories = Math.round(last7Days.reduce((a, b) => a + b.caloriesConsumed, 0) / 7);
  const avgProtein = Math.round(last7Days.reduce((a, b) => a + b.proteinConsumed, 0) / 7);

  const [isGenerating, setIsGenerating] = useState(false);
  const [insights, setInsights] = useState<{title: string, body: string, type: 'positive' | 'warning' | 'negative'}[] | null>(null);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setInsights([
        { type: 'positive', title: 'Consistent Protein', body: 'You hit your protein goal 5 out of 7 days this week. Great job fueling your recovery.' },
        { type: 'warning', title: 'Late Night Snacking', body: 'A pattern of late night calories was detected on Thursday and Friday.' },
        { type: 'negative', title: 'Hydration Dropping', body: 'Your water intake has been below target for the past 3 days.' }
      ]);
      setIsGenerating(false);
    }, 1500);
  };

  const containerVariants: any = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  return (
    <Profiler id="WeeklyReportPage" onRender={onRenderCallback}>
      <div className="page-enter px-4 py-4 min-h-[100dvh] bg-[#0A0A0A] pb-[calc(100px+env(safe-area-inset-bottom))]">
      
      {/* Week Selector */}
      <div className="flex justify-between items-center mb-6">
        <motion.button whileTap={{ x: -2 }} className="card-base inline-flex items-center px-[14px] py-[6px]">
           <ChevronLeft size={16} className="text-white mr-1 opacity-60" />
           <span className="text-[13px] font-medium text-white">Prev</span>
        </motion.button>
        <div className="text-[14px] font-semibold text-white">This Week</div>
        <motion.button whileTap={{ x: 2 }} className="card-base inline-flex items-center px-[14px] py-[6px] opacity-50 cursor-not-allowed">
           <span className="text-[13px] font-medium text-white">Next</span>
           <ChevronRight size={16} className="text-white ml-1 opacity-60" />
        </motion.button>
      </div>

      {loggedDaysCount < 3 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 mb-6 relative flex items-center justify-center">
             <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
               <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
               <circle cx="50" cy="50" r="46" fill="none" stroke="#D4FF00" strokeWidth="8" strokeDasharray="289" strokeDashoffset={289 - (289 * (loggedDaysCount/3))} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
             </svg>
             <div className="absolute inset-0 flex items-center justify-center text-[24px] font-bold text-white">{loggedDaysCount}/3</div>
          </div>
          <div className="text-[16px] font-semibold text-white mb-2">3 days to unlock</div>
          <div className="text-[13px] text-[rgba(255,255,255,0.4)] mb-4">Log more meals to generate your weekly report.</div>
          <div className="badge-lime">{loggedDaysCount} logged so far</div>
        </div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show">
          
          {/* 3-stat summary */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <motion.div variants={itemVariants} className="bg-[#111113] border-[0.5px] border-[rgba(255,255,255,0.06)] rounded-2xl p-4 text-center">
              <div className="text-[10px] uppercase tracking-wider text-[rgba(255,255,255,0.4)] mb-1 font-semibold">Compliance</div>
              <div className="text-[28px] font-bold text-[#D4FF00] tracking-tight">{avgCompliance}%</div>
            </motion.div>
            <motion.div variants={itemVariants} className="bg-[#111113] border-[0.5px] border-[rgba(255,255,255,0.06)] rounded-2xl p-4 text-center">
              <div className="text-[10px] uppercase tracking-wider text-[rgba(255,255,255,0.4)] mb-1 font-semibold">Avg Kcal</div>
              <div className="text-[28px] font-bold text-[#FF4D1C] tracking-tight">{avgCalories}</div>
            </motion.div>
            <motion.div variants={itemVariants} className="bg-[#111113] border-[0.5px] border-[rgba(255,255,255,0.06)] rounded-2xl p-4 text-center">
              <div className="text-[10px] uppercase tracking-wider text-[rgba(255,255,255,0.4)] mb-1 font-semibold">Avg Pro</div>
              <div className="text-[28px] font-bold text-[#378ADD] tracking-tight">{avgProtein}</div>
            </motion.div>
          </div>

          {/* Daily compliance bars */}
          <motion.div variants={itemVariants} className="mb-8">
             <div className="text-[13px] font-semibold text-white mb-4 ml-1">Daily Compliance</div>
             <div className="flex flex-col gap-1">
               {last7Days.map((day, i) => {
                 const d = new Date(day.date);
                 const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
                 const pct = Math.min(Math.max(day.complianceScore, 0), 100);
                 const barColor = pct >= 80 ? '#D4FF00' : (pct >= 60 ? '#fbbf24' : '#FF4D1C');
                 return (
                   <div key={day.date} className="flex items-center gap-3 py-2">
                     <div className="text-[11px] font-mono uppercase text-[rgba(255,255,255,0.4)] w-8">{dayLabel}</div>
                     <div className="progress-track flex-1 h-2 rounded-full overflow-hidden bg-[rgba(255,255,255,0.06)]">
                       <motion.div 
                         initial={{ width: 0 }} 
                         animate={{ width: `${pct}%` }} 
                         transition={{ duration: 0.8, delay: i * 0.08, ease: "easeOut" }}
                         className="h-full rounded-full"
                         style={{ backgroundColor: barColor }}
                       />
                     </div>
                     <div className="text-[12px] font-mono text-[rgba(255,255,255,0.55)] w-8 text-right">{pct}</div>
                   </div>
                 );
               })}
             </div>
          </motion.div>

          {/* AI Insights or Generate Button */}
          {insights ? (
            <motion.div variants={itemVariants} className="stagger-children flex flex-col gap-3">
              <div className="text-[13px] font-semibold text-white mb-2 ml-1">AI Insights</div>
              {insights.map((insight, idx) => {
                const color = insight.type === 'positive' ? '#D4FF00' : (insight.type === 'warning' ? '#fbbf24' : '#FF4D1C');
                return (
                  <motion.div key={idx} variants={itemVariants} className="card-base p-[14px]" style={{ borderLeft: `3px solid ${color}` }}>
                    <div className="text-[13px] font-semibold text-white">{insight.title}</div>
                    <div className="text-[13px] text-[rgba(255,255,255,0.6)] leading-relaxed mt-1">{insight.body}</div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div variants={itemVariants} className="mt-8">
               <button onClick={handleGenerate} disabled={isGenerating} className="btn-primary w-full flex items-center justify-center py-3.5 relative overflow-hidden">
                 {isGenerating ? (
                   <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin"></div>
                 ) : (
                   <span className="font-semibold text-black text-[15px]">Generate AI Report</span>
                 )}
               </button>
            </motion.div>
          )}

        </motion.div>
      )}
    </div>
    </Profiler>
  );
}
