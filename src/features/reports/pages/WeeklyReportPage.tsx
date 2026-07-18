import React, { useState, useMemo, Profiler } from 'react';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/features/profile/services/profileService';
import { mealService } from '@/features/nutrition/services/mealService';
import { reportService } from '../services/reportService';
import { 
  ChevronLeft, Loader2, Sparkles, Activity, Target, 
  Flame, TrendingUp, TrendingDown, ArrowRight, CheckCircle2, AlertTriangle, Info, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DailyActivityData } from '@/shared/types/activity';
import { useNavigate } from 'react-router-dom';
import { haptics } from '@/shared/utils/haptics';
import { onRenderCallback, useRenderTracker } from '@/shared/utils/perfDebug';
import { generateCoachReport, CoachReport } from '../services/coachReportGenerator';
import { cn } from "@/shared/utils/utils";

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

  const previous7Days: DailyActivityData[] = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (13 - i));
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

  const activeDays = last7Days.filter(d => d.caloriesConsumed > 0 || d.complianceScore > 0);
  const loggedDaysCount = activeDays.length;

  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<CoachReport | null>(null);

  const handleGenerate = () => {
    haptics.tap(); haptics.tap(); haptics.tap();
    setIsGenerating(true);
    setTimeout(() => {
      haptics.success(); haptics.success(); haptics.success();
      try {
        const mealsLast7 = meals.filter(m => last7Days.some(d => m.meal_time.startsWith(d.date)));
        setReport(generateCoachReport(last7Days, previous7Days, mealsLast7, calorieGoal));
      } catch (e) {
        // Not enough data error handled natively by not reaching here if loggedDaysCount < 3
      }
      setIsGenerating(false);
    }, 1500);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 250, damping: 25 } }
  };

  return (
    <Profiler id="WeeklyReportPage" onRender={onRenderCallback}>
      <div className="page-enter pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(100px+env(safe-area-inset-bottom))] min-h-[100dvh] bg-[#0A0A0A] px-4">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 sticky top-[env(safe-area-inset-top)] z-30 bg-[#0A0A0A]/90 backdrop-blur-md pb-2">
          <button onClick={() => navigate("/dashboard")} className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center transition-colors hover:bg-[rgba(255,255,255,0.1)]">
            <ChevronLeft size={22} className="text-white" />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#D4FF00]" />
            <h1 className="text-[16px] font-semibold text-white tracking-tight">AI Coach Report</h1>
          </div>
          <div className="w-10"></div>
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
            <div className="text-[20px] font-semibold text-white mb-2 tracking-tight">More Data Required</div>
            <div className="text-[15px] text-[rgba(255,255,255,0.5)] mb-8 max-w-[280px] leading-relaxed">
              Your AI coach needs at least 3 days of nutrition logs this week to generate an accurate analysis.
            </div>
            <div className="bg-[rgba(212,255,0,0.1)] border border-[rgba(212,255,0,0.2)] text-[#D4FF00] px-5 py-2.5 rounded-full text-[13px] font-semibold uppercase tracking-wider">
              {loggedDaysCount} logged so far
            </div>
          </motion.div>
        ) : !report ? (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col items-center justify-center py-16">
            <motion.div variants={itemVariants} className="w-20 h-20 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-full flex items-center justify-center mb-8 relative">
              <Sparkles size={32} className="text-[#D4FF00]" />
              <div className="absolute inset-0 bg-[#D4FF00] opacity-10 blur-xl rounded-full"></div>
            </motion.div>
            
            <motion.h2 variants={itemVariants} className="text-[28px] font-bold text-white mb-4 tracking-tight text-center">
              Ready for Review
            </motion.h2>
            
            <motion.p variants={itemVariants} className="text-[15px] text-[rgba(255,255,255,0.5)] mb-10 text-center max-w-[280px] leading-relaxed">
              Your AI coach has analyzed {loggedDaysCount} days of meals, calories, and patterns to build your personalized weekly report.
            </motion.p>
            
            <motion.button
              variants={itemVariants}
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full max-w-[300px] bg-white text-black font-semibold text-[16px] rounded-full py-4 px-6 flex items-center justify-center relative overflow-hidden transition-transform active:scale-[0.98]"
            >
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <Loader2 size={20} className="animate-spin" />
                  <span>Synthesizing Insights...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles size={18} />
                  <span>Generate AI Report</span>
                </div>
              )}
            </motion.button>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
            
            {/* 1. Weekly Summary Hero */}
            <motion.section variants={itemVariants} className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-[32px] p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4FF00] opacity-[0.04] blur-3xl rounded-full translate-x-1/3 -translate-y-1/3"></div>
              
              <h2 className="text-[13px] uppercase tracking-[0.2em] font-semibold text-[rgba(255,255,255,0.4)] mb-4 flex items-center gap-2">
                <Calendar size={14} />
                Weekly Summary
              </h2>
              
              <p className="text-[18px] text-white font-medium leading-relaxed mb-8 tracking-tight">
                {report.summary.narrative}
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[rgba(0,0,0,0.2)] rounded-[20px] p-4 border border-[rgba(255,255,255,0.04)]">
                  <div className="text-[12px] text-[rgba(255,255,255,0.5)] font-medium mb-1">Score</div>
                  <div className="text-[28px] font-bold text-[#D4FF00] tracking-tighter">{report.summary.overallScore}</div>
                </div>
                <div className="bg-[rgba(0,0,0,0.2)] rounded-[20px] p-4 border border-[rgba(255,255,255,0.04)]">
                  <div className="text-[12px] text-[rgba(255,255,255,0.5)] font-medium mb-1">Confidence</div>
                  <div className="text-[16px] font-semibold text-white tracking-tight mt-2">{report.summary.aiConfidence}</div>
                </div>
              </div>
            </motion.section>

            {/* 2. Coach Summary */}
            <motion.section variants={itemVariants} className="px-2">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-[rgba(212,255,0,0.1)] flex items-center justify-center">
                  <Sparkles size={16} className="text-[#D4FF00]" />
                </div>
                <h2 className="text-[16px] font-semibold text-white tracking-tight">AI Coach Notes</h2>
              </div>
              <p className="text-[15px] text-[rgba(255,255,255,0.7)] leading-relaxed font-medium pl-11">
                {report.nutritionConsistency.narrative} {report.eatingBehavior.narrative}
              </p>
            </motion.section>

            <div className="h-px w-full bg-[rgba(255,255,255,0.06)] my-4"></div>

            {/* 3 & 4. Analytics & Patterns */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4">
              
              {/* Protein Deep Dive */}
              <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-5">
                <h3 className="text-[14px] font-semibold text-white tracking-tight mb-3 flex items-center gap-2">
                  <Target size={16} className="text-[#D4FF00]" />
                  Protein Analysis
                </h3>
                <p className="text-[14px] text-[rgba(255,255,255,0.6)] leading-relaxed mb-4">
                  {report.proteinAnalysis.narrative}
                </p>
                <div className="flex items-center justify-between bg-[rgba(0,0,0,0.2)] p-3 rounded-[16px]">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-[rgba(255,255,255,0.4)] uppercase tracking-wider font-semibold">Avg Intake</span>
                    <span className="text-[16px] font-bold text-white">{report.proteinAnalysis.avgIntake}g</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[11px] text-[rgba(255,255,255,0.4)] uppercase tracking-wider font-semibold">Goal Met</span>
                    <span className="text-[16px] font-bold text-white">{report.proteinAnalysis.targetReachedDays}/7 Days</span>
                  </div>
                </div>
              </div>

              {/* Calorie Trends */}
              <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-5">
                <h3 className="text-[14px] font-semibold text-white tracking-tight mb-3 flex items-center gap-2">
                  <Flame size={16} className="text-[#D4FF00]" />
                  Calorie Trend
                </h3>
                <div className="mb-3">
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider",
                    report.calorieTrend.consistencyScore === 'Excellent' ? "bg-[rgba(212,255,0,0.1)] text-[#D4FF00]" : 
                    report.calorieTrend.consistencyScore === 'Good' ? "bg-[rgba(255,255,255,0.1)] text-white" : "bg-[rgba(255,77,28,0.1)] text-[#FF4D1C]"
                  )}>
                    {report.calorieTrend.consistencyScore} Consistency
                  </span>
                </div>
                <p className="text-[14px] text-[rgba(255,255,255,0.6)] leading-relaxed">
                  {report.calorieTrend.narrative}
                </p>
                <p className="text-[14px] text-[rgba(255,255,255,0.6)] leading-relaxed mt-2 pt-2 border-t border-[rgba(255,255,255,0.05)]">
                  {report.weekendBehavior.narrative}
                </p>
              </div>

            </motion.div>

            {/* 12. AI Detected Patterns */}
            <motion.section variants={itemVariants} className="pt-2">
              <h3 className="text-[12px] uppercase tracking-[0.15em] font-semibold text-[rgba(255,255,255,0.4)] mb-4 ml-2">Detected Patterns</h3>
              <div className="flex flex-wrap gap-2">
                {report.aiPatterns.map((pattern, idx) => (
                  <div key={idx} className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] px-4 py-2.5 rounded-full flex items-center gap-2">
                    <Activity size={14} className="text-[rgba(255,255,255,0.6)]" />
                    <span className="text-[13px] font-semibold text-white tracking-tight">{pattern}</span>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* 13. Personalized Recommendations */}
            <motion.section variants={itemVariants} className="pt-4">
              <h3 className="text-[16px] font-semibold text-white tracking-tight mb-4 ml-2">Action Plan</h3>
              <div className="space-y-3">
                {report.recommendations.map((rec, idx) => (
                  <div key={idx} className="bg-white text-black rounded-[24px] p-5 relative overflow-hidden">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[rgba(0,0,0,0.5)] mb-1">Focus {idx + 1}</div>
                    <div className="text-[18px] font-bold tracking-tight mb-2 leading-tight">{rec.problem}</div>
                    <p className="text-[14px] font-medium text-[rgba(0,0,0,0.7)] leading-relaxed mb-4">
                      {rec.whyItMatters}
                    </p>
                    <div className="bg-[rgba(0,0,0,0.05)] rounded-[16px] p-3 flex items-start gap-3">
                      <ArrowRight size={16} className="mt-0.5 shrink-0" />
                      <span className="text-[13px] font-bold leading-snug">{rec.action}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* 10 & 11. Best/Worst Day */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 pt-4">
              <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-[20px] p-4">
                <div className="flex items-center gap-2 mb-2 text-[#D4FF00]">
                  <TrendingUp size={16} />
                  <span className="text-[12px] font-bold uppercase tracking-wider">Best Day</span>
                </div>
                <div className="text-[16px] font-bold text-white tracking-tight mb-2">{report.bestDay.dayLabel}</div>
                <div className="space-y-1">
                  {report.bestDay.reasons.map((r, i) => (
                    <div key={i} className="text-[12px] text-[rgba(255,255,255,0.6)] flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-[rgba(255,255,255,0.3)]" />
                      {r}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-[20px] p-4">
                <div className="flex items-center gap-2 mb-2 text-[rgba(255,255,255,0.5)]">
                  <TrendingDown size={16} />
                  <span className="text-[12px] font-bold uppercase tracking-wider">Opportunity</span>
                </div>
                <div className="text-[16px] font-bold text-white tracking-tight mb-2">{report.worstDay.dayLabel}</div>
                <p className="text-[12px] text-[rgba(255,255,255,0.6)] leading-relaxed">
                  {report.worstDay.explanation}
                </p>
              </div>
            </motion.div>

            {/* 15. Motivation */}
            <motion.section variants={itemVariants} className="pt-8 pb-4 text-center">
              <p className="text-[16px] font-medium text-[rgba(255,255,255,0.8)] leading-relaxed italic px-4">
                "{report.motivation}"
              </p>
              <div className="w-8 h-1 bg-[#D4FF00] rounded-full mx-auto mt-6 opacity-50"></div>
            </motion.section>

          </motion.div>
        )}
      </div>
    </Profiler>
  );
}
