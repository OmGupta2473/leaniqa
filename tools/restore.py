import re

head = """import { onRenderCallback, useRenderTracker } from '@/shared/utils/perfDebug';
import React, { useState, useMemo, Profiler, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/features/profile/services/profileService';
import { mealService } from '@/features/nutrition/services/mealService';
import { reportService } from '../services/reportService';
import { ChevronLeft, ChevronRight, CheckCircle2, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DailyActivityData } from '@/shared/types/activity';
import { cn } from "@/shared/utils/utils";
import { useNavigate } from 'react-router-dom';
import { haptics } from '@/shared/utils/haptics';

function getLocalDateString(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function WeeklyReportPage() {
  useRenderTracker('WeeklyReportPage');
  const navigate = useNavigate();
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
      
      const caloriesConsumed = dayMeals.reduce((a, m) => a + m.calories, 0);
      const proteinConsumed = dayMeals.reduce((a, m) => a + m.protein, 0);
      
      return {
        date: dateStr,
        caloriesConsumed,
        calorieTarget: metric?.target_calories ?? calorieGoal,
        proteinConsumed,
        proteinTarget: metric?.target_protein ?? proteinGoal,
        fatConsumed: dayMeals.reduce((a, m) => a + m.fat, 0),
        fatTarget: 60,
        carbsConsumed: dayMeals.reduce((a, m) => a + m.carbs, 0),
        carbsTarget: 220,
        complianceScore: metric?.score ?? 0,
      };
    });
  }, [meals, dailyMetrics, calorieGoal, proteinGoal]);
"""

# Now we need the middle part which contains generateDynamicInsights etc.
# In task 223, I did grep -B 10 -A 100 "const generateDynamicInsights"
middle = """
  const activeDays = last7Days.filter(d => d.caloriesConsumed > 0 || d.complianceScore > 0);
  const loggedDaysCount = activeDays.length;
  
  const avgCompliance = loggedDaysCount > 0 ? Math.round(activeDays.reduce((a, b) => a + b.complianceScore, 0) / loggedDaysCount) : 0;
  const avgCalories = loggedDaysCount > 0 ? Math.round(activeDays.reduce((a, b) => a + b.caloriesConsumed, 0) / loggedDaysCount) : 0;
  const avgProtein = loggedDaysCount > 0 ? Math.round(activeDays.reduce((a, b) => a + b.proteinConsumed, 0) / loggedDaysCount) : 0;

  const [isGenerating, setIsGenerating] = useState(false);
  const [insights, setInsights] = useState<{title: string, body: string, type: 'positive' | 'warning' | 'negative'}[] | null>(null);

  const generateDynamicInsights = () => {
    const newInsights: {title: string, body: string, type: 'positive' | 'warning' | 'negative'}[] = [];
    
    // 1. Protein Analysis
    const proteinHitDays = activeDays.filter(d => d.proteinConsumed >= d.proteinTarget * 0.9).length;
    if (proteinHitDays >= 4) {
      newInsights.push({
        type: 'positive',
        title: 'Strong Protein Consistency',
        body: `You hit your protein goal ${proteinHitDays} out of ${loggedDaysCount} tracked days this week. Excellent for muscle recovery and satiety.`
      });
    } else if (loggedDaysCount > 0) {
      newInsights.push({
        type: 'warning',
        title: 'Protein Opportunity',
        body: `You only hit your protein goal ${proteinHitDays} days this week. Try adding a lean protein source to your first meal.`
      });
    }

    // 2. Calorie Adherence
    const caloriesOver = activeDays.filter(d => d.caloriesConsumed > d.calorieTarget * 1.1).length;
    const caloriesUnder = activeDays.filter(d => d.caloriesConsumed < d.calorieTarget * 0.8).length;
    const caloriesOnTarget = loggedDaysCount - caloriesOver - caloriesUnder;
    
    if (caloriesOnTarget >= 4) {
      newInsights.push({
        type: 'positive',
        title: 'Excellent Caloric Adherence',
        body: `You stayed within your target calorie range for ${caloriesOnTarget} days. This consistency is key to seeing physical changes.`
      });
    } else if (caloriesOver >= 3) {
      newInsights.push({
        type: 'negative',
        title: 'Caloric Surplus Detected',
        body: `You exceeded your calorie target on ${caloriesOver} days. This may slow down fat loss. Focus on volume-eating with vegetables.`
      });
    } else if (caloriesUnder >= 3) {
      newInsights.push({
        type: 'warning',
        title: 'Under-eating Risk',
        body: `You were significantly below your calorie target on ${caloriesUnder} days. Ensure you are eating enough to prevent metabolic adaptation and fatigue.`
      });
    }

    // 3. Overall Compliance Trend
    if (avgCompliance >= 85) {
      newInsights.push({
        type: 'positive',
        title: 'Elite Compliance',
        body: `Your average weekly compliance score is ${avgCompliance}%. You are executing the plan perfectly.`
      });
    } else if (avgCompliance >= 70) {
      newInsights.push({
        type: 'warning',
        title: 'Good, But Room to Grow',
        body: `Your compliance is ${avgCompliance}%. Aim for 80%+ consistency for optimal, predictable results.`
      });
    }

    // Fallback if not enough data triggers
    if (newInsights.length === 0) {
      newInsights.push({
        type: 'positive',
        title: 'Data Accumulating',
        body: 'Keep logging your meals and weight. More detailed insights will generate as you build consistency.'
      });
    }

    return newInsights;
  };

  const handleGenerate = () => {
    haptics.tap();
    haptics.tap();
    haptics.tap();
    setIsGenerating(true);
    setTimeout(() => {
      haptics.success();
      haptics.success();
      haptics.success();
      setInsights(generateDynamicInsights());
      setIsGenerating(false);
    }, 1200);
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
      <div className="page-enter pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(100px+env(safe-area-inset-bottom))] min-h-[100dvh] bg-[#0A0A0A] px-4">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 sticky top-[env(safe-area-inset-top)] z-30">
          <button onClick={() => navigate("/dashboard")} className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center transition-colors hover:bg-[rgba(255,255,255,0.1)]">
            <ChevronLeft size={20} className="text-white" />
          </button>
          <h1 className="text-[16px] font-semibold text-white tracking-tight">Weekly Report</h1>
          <div className="w-8"></div>
        </div>

        {loggedDaysCount < 3 ? (
          <motion.div initial={{opacity: 0, scale: 0.95}} animate={{opacity: 1, scale: 1}} className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 mb-6 relative flex items-center justify-center">
               <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                 <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                 <circle cx="50" cy="50" r="46" fill="none" stroke="#D4FF00" strokeWidth="8" strokeDasharray="289" strokeDashoffset={289 - (289 * (loggedDaysCount/3))} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
               </svg>
               <div className="absolute inset-0 flex items-center justify-center text-[24px] font-bold text-white">{loggedDaysCount}/3</div>
            </div>
            <div className="text-[18px] font-semibold text-white mb-2 tracking-tight">3 Days to Unlock</div>
            <div className="text-[14px] text-[rgba(255,255,255,0.5)] mb-6 max-w-[240px] leading-relaxed">
              Log your meals for at least 3 days this week to generate accurate insights.
            </div>
            <div className="bg-[rgba(212,255,0,0.1)] border border-[rgba(212,255,0,0.2)] text-[#D4FF00] px-4 py-2 rounded-full text-[12px] font-semibold uppercase tracking-wider">
              {loggedDaysCount} logged so far
            </div>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="show">
            
            {/* Stats Overview Grid */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <motion.div variants={itemVariants} className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-5 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4FF00] opacity-[0.03] blur-2xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
                <div className="text-[11px] uppercase tracking-widest text-[rgba(255,255,255,0.5)] mb-2 font-semibold">Avg Compliance</div>
                <div className="text-[36px] font-bold text-[#D4FF00] tracking-tighter leading-none mb-1">{avgCompliance}%</div>
              </motion.div>
              
              <div className="flex flex-col gap-3">
                <motion.div variants={itemVariants} className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-[20px] p-4 flex-1 flex flex-col justify-center">
                  <div className="text-[10px] uppercase tracking-widest text-[rgba(255,255,255,0.5)] mb-1 font-semibold">Avg Calories</div>
                  <div className="text-[20px] font-bold text-white tracking-tight">{avgCalories} <span className="text-[12px] text-[rgba(255,255,255,0.4)] font-normal">kcal</span></div>
                </motion.div>
                <motion.div variants={itemVariants} className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-[20px] p-4 flex-1 flex flex-col justify-center">
                  <div className="text-[10px] uppercase tracking-widest text-[rgba(255,255,255,0.5)] mb-1 font-semibold">Avg Protein</div>
                  <div className="text-[20px] font-bold text-white tracking-tight">{avgProtein} <span className="text-[12px] text-[rgba(255,255,255,0.4)] font-normal">g</span></div>
                </motion.div>
              </div>
            </div>

            {/* Daily Compliance Chart */}
            <motion.div variants={itemVariants} className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] rounded-[24px] p-5 mb-8">
               <div className="flex items-center gap-2 mb-6">
                 <TrendingUp size={16} className="text-[#D4FF00]" />
                 <h2 className="text-[15px] font-semibold text-white tracking-tight">Daily Breakdown</h2>
               </div>
               
               <div className="flex flex-col gap-4">
                 {last7Days.map((day, i) => {
                   const d = new Date(day.date);
                   const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
                   const pct = Math.min(Math.max(day.complianceScore, 0), 100);
                   const barColor = pct >= 80 ? '#D4FF00' : (pct >= 50 ? '#fbbf24' : '#FF4D1C');
                   
                   return (
                     <div key={day.date} className="flex items-center gap-4">
                       <div className="text-[12px] font-medium text-[rgba(255,255,255,0.5)] w-8">{dayLabel}</div>
                       <div className="flex-1 h-3 rounded-full overflow-hidden bg-[rgba(255,255,255,0.05)] relative">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${pct}%` }}
                           transition={{ duration: 1, delay: i * 0.05, type: "spring", stiffness: 100, damping: 20 }}
                           className="absolute top-0 left-0 bottom-0 rounded-full"
                           style={{ backgroundColor: barColor }}
                         />
                       </div>
                       <div className="text-[13px] font-bold text-white w-10 text-right">{pct}%</div>
                     </div>
                   );
                 })}
               </div>
            </motion.div>

            {/* AI Insights Engine */}
            {insights ? (
              <motion.div variants={itemVariants} className="flex flex-col gap-4 mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[#D4FF00] animate-pulse" />
                  <h2 className="text-[15px] font-semibold text-white tracking-tight">AI Report Generated</h2>
                </div>
                
                <AnimatePresence>
                  {insights.map((insight, idx) => {
                    const color = insight.type === 'positive' ? '#D4FF00' : (insight.type === 'warning' ? '#fbbf24' : '#FF4D1C');
                    const Icon = insight.type === 'positive' ? CheckCircle2 : AlertTriangle;
                    return (
                      <motion.div 
                        key={idx} 
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.4, delay: idx * 0.1, type: "spring" }}
                        className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-[20px] p-5 relative overflow-hidden"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1 opacity-80" style={{ backgroundColor: color }} />
                        <div className="flex items-start gap-4">
                          <div className="mt-0.5 opacity-80" style={{ color }}>
                            <Icon size={18} />
                          </div>
                          <div>
                            <div className="text-[15px] font-bold text-white tracking-tight mb-1">{insight.title}</div>
                            <div className="text-[14px] text-[rgba(255,255,255,0.6)] leading-relaxed font-medium">{insight.body}</div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div variants={itemVariants} className="mt-8 mb-8">
                 <button
                   onClick={handleGenerate}
                   disabled={isGenerating}
                   className="w-full bg-white text-black font-semibold text-[15px] rounded-[20px] py-4 flex items-center justify-center relative overflow-hidden transition-transform active:scale-[0.98]"
                 >
                   {isGenerating ? (
                     <div className="flex items-center gap-2">
                       <Loader2 size={18} className="animate-spin" />
                       <span>Analyzing Data...</span>
                     </div>
                   ) : (
                     <span>Generate Progress Report</span>
                   )}
                 </button>
                 <p className="text-center text-[12px] text-[rgba(255,255,255,0.4)] mt-4 font-medium">
                   Report is generated locally using your actual logged data.
                 </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </Profiler>
  );
}
"""

with open("src/features/reports/pages/WeeklyReportPage.tsx", "w") as f:
    f.write(head + middle)
