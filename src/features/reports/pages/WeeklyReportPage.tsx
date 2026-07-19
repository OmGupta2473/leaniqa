import { onRenderCallback, useRenderTracker } from '@/shared/utils/perfDebug';
import React, { useState, useMemo, Profiler } from 'react';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/features/profile/services/profileService';
import { mealService } from '@/features/nutrition/services/mealService';
import { reportService } from '../services/reportService';
import { ChevronLeft, CheckCircle2, TrendingUp, AlertTriangle, Loader2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DailyActivityData } from '@/shared/types/activity';
import { cn } from "@/shared/utils/utils";
import { useNavigate } from 'react-router-dom';
import { haptics } from '@/shared/utils/haptics';
import { calculateDailyScore } from '@/shared/utils/complianceEngine';
import { weightService } from '@/features/progress/services/weightService';

function getLocalDateString(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// -- AI Logic (Deterministic) --

function generateCoachData(days: DailyActivityData[], loggedCount: number) {
  if (loggedCount < 3) return null;

  const activeDays = days.filter(d => d.caloriesConsumed > 0 || d.complianceScore > 0);
  
  let proteinHits = 0;
  let calorieHits = 0;
  let totalDeficit = 0;
  let weekendCals = 0;
  let weekdayCals = 0;
  
  activeDays.forEach(d => {
    if (d.proteinConsumed >= d.proteinTarget * 0.9) proteinHits++;
    if (d.caloriesConsumed <= d.calorieTarget * 1.1 && d.caloriesConsumed >= d.calorieTarget * 0.8) calorieHits++;
    totalDeficit += (d.calorieTarget - d.caloriesConsumed);
    
    const [y, m, day] = d.date.split('-').map(Number);
    const date = new Date(y, m - 1, day);
    if (date.getDay() === 0 || date.getDay() === 6) {
      weekendCals += d.caloriesConsumed;
    } else {
      weekdayCals += d.caloriesConsumed;
    }
  });

  const avgProtein = activeDays.reduce((a, b) => a + b.proteinConsumed, 0) / loggedCount;
  const avgCompliance = activeDays.reduce((a, b) => a + b.complianceScore, 0) / loggedCount;
  
  const getLocalDay = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).getDay();
  };

  const weekendAvg = activeDays.filter(d => getLocalDay(d.date) === 0 || getLocalDay(d.date) === 6).length > 0 ? weekendCals / activeDays.filter(d => getLocalDay(d.date) === 0 || getLocalDay(d.date) === 6).length : 0;
  const weekdayAvg = activeDays.filter(d => getLocalDay(d.date) > 0 && getLocalDay(d.date) < 6).length > 0 ? weekdayCals / activeDays.filter(d => getLocalDay(d.date) > 0 && getLocalDay(d.date) < 6).length : 0;

  // Generate Summary
  let summaryShort = "";
  let summaryLong = "";
  
  if (avgCompliance >= 80) {
    summaryShort = `Excellent consistency this week. You logged your meals reliably and stayed aligned with your targets.`;
    summaryLong = `Your overall weekly performance was outstanding with an average compliance of ${Math.round(avgCompliance)}%. Your biggest improvement was staying within your caloric boundaries on most days. Keep this up and you will see steady results.`;
  } else if (avgCompliance >= 60) {
    summaryShort = `Good effort this week. You had some strong days, but consistency dropped slightly towards the end of the week.`;
    summaryLong = `You achieved a solid ${Math.round(avgCompliance)}% compliance. The biggest opportunity for improvement is reducing calorie spikes. If we can tighten up the weekend, your progress will accelerate.`;
  } else {
    summaryShort = `A challenging week, but you are still tracking. Your calories trended higher than your targets.`;
    summaryLong = `Your compliance was ${Math.round(avgCompliance)}%. The main challenge was exceeding calorie limits. Tracking is the first step, so give yourself credit for logging. Let's aim to hit our protein target consistently next week.`;
  }

  if (proteinHits >= 4) {
    summaryShort += ` Protein intake was fantastic, which helps support muscle retention.`;
    summaryLong += ` You hit your protein goal on ${proteinHits} days, which is excellent.`;
  } else {
    summaryShort += ` Protein intake was slightly lower than ideal.`;
    summaryLong += ` We missed the protein target on several days. Adding more lean sources earlier in the day can fix this.`;
  }

  if (weekendAvg > weekdayAvg * 1.2) {
    summaryShort += ` Weekend calories were noticeably higher, which slowed overall progress.`;
    summaryLong += ` You consumed about ${Math.round(weekendAvg - weekdayAvg)} more calories on weekends compared to weekdays. Smoothing this out will be key.`;
  }

  // Generate Recommendations
  const recs = [];

  if (proteinHits < loggedCount * 0.7) {
    recs.push({
      id: 1,
      title: "Increase Breakfast Protein",
      description: "Adding 25g of protein in the morning will improve satiety and help you consistently reach your daily target.",
      impact: "High Impact" as const
    });
  } else {
    recs.push({
      id: 2,
      title: "Keep Protein Consistent",
      description: "Your protein intake has been excellent. This is the foundation of your muscle retention.",
      impact: "Maintain" as const
    });
  }

  if (weekendAvg > weekdayAvg * 1.2) {
    recs.push({
      id: 3,
      title: "Reduce Weekend Calories",
      description: `Your weekend intake is significantly higher (+${Math.round(weekendAvg - weekdayAvg)} kcal). Try planning one structured meal on Saturdays to stay anchored.`,
      impact: "High Impact" as const
    });
  }

  if (calorieHits < loggedCount * 0.6) {
    recs.push({
      id: 4,
      title: "Tighten Calorie Tracking",
      description: "You fluctuated outside your calorie target frequently. Focus on volume-eating with vegetables to stay full.",
      impact: "Medium Impact" as const
    });
  }

  if (loggedCount < 7) {
    recs.push({
      id: 5,
      title: "Improve Meal Logging",
      description: `You logged ${loggedCount} out of 7 days. Logging every day, even bad ones, gives us the data needed to adjust.`,
      impact: "Medium Impact" as const
    });
  }

  // If we don't have 3 recs, add generic maintain
  if (recs.length < 3) {
    if (!recs.find(r => r.title.includes("Lunch"))) {
      recs.push({
        id: 6,
        title: "Keep Lunch Consistent",
        description: "Your midday meals have been balanced. Keep prepping or choosing smart options.",
        impact: "Maintain" as const
      });
    }
    if (recs.length < 3 && !recs.find(r => r.title.includes("Hydration"))) {
      recs.push({
        id: 7,
        title: "Maintain Hydration",
        description: "Water intake supports metabolism and reduces false hunger signals.",
        impact: "Low Priority" as const
      });
    }
  }

  return {
    summaryShort,
    summaryLong,
    recommendations: recs.slice(0, 3).sort((a, b) => {
      const rank = { "High Impact": 0, "Medium Impact": 1, "Maintain": 2, "Low Priority": 3 };
      return rank[a.impact] - rank[b.impact];
    })
  };
}


export function WeeklyReportPage() {
  useRenderTracker('WeeklyReportPage');
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useQuery({ queryKey: ['profile'], queryFn: () => profileService.getProfile() });
  const { data: goal, isLoading: goalLoading } = useQuery({ queryKey: ['goal'], queryFn: () => profileService.getGoal() });
  const { data: meals = [], isLoading: mealsLoading } = useQuery({ queryKey: ['meals', 'month'], queryFn: () => mealService.getMeals({ days: 35, limit: 2000 }) });
  const { data: dailyMetrics = [], isLoading: metricsLoading } = useQuery({ queryKey: ['dailyMetrics'], queryFn: () => reportService.getDailyMetrics() });
  const { data: weightLogs = [] } = useQuery({ queryKey: ['weightLogs'], queryFn: () => weightService.getWeightLogs() });

  const isLoading = profileLoading || goalLoading || mealsLoading || metricsLoading;
  
  const calorieGoal = profile?.maintenance_kcal && goal?.deficit_kcal !== undefined ? profile.maintenance_kcal - goal.deficit_kcal : 2000;
  const proteinGoal = profile?.protein_target || 150;
  const today = new Date();
  
  const last7Days: DailyActivityData[] = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      const dateStr = getLocalDateString(d);
      
      const dayMeals = meals.filter(m => {
        const d = new Date(m.meal_time);
        const mDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return mDateStr === dateStr;
      });
      
      const metric = dailyMetrics.find(m => m.date === dateStr);
      
      const caloriesConsumed = dayMeals.reduce((a, m) => a + m.calories, 0);
      const proteinConsumed = dayMeals.reduce((a, m) => a + m.protein, 0);
      
      let complianceScore = metric?.score ?? 0;
      
      // Dynamic recalculation to fix stale metrics caused by previous UTC bugs
      if (caloriesConsumed > 0 && metric?.actual_calories !== caloriesConsumed) {
         const hasWeightLogged = weightLogs.some((w: any) => w.date.startsWith(dateStr));
         complianceScore = calculateDailyScore({
           targetCalories: metric?.target_calories ?? calorieGoal,
           actualCalories: caloriesConsumed,
           targetProtein: metric?.target_protein ?? proteinGoal,
           actualProtein: proteinConsumed,
           hasWeightLogged
         });
      }
      
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
        complianceScore,
      };
    });
  }, [meals, dailyMetrics, calorieGoal, proteinGoal, today, weightLogs]);

  const activeDays = last7Days.filter(d => d.caloriesConsumed > 0 || d.complianceScore > 0);
  const loggedDaysCount = activeDays.length;
  
  const avgCompliance = loggedDaysCount > 0 ? Math.round(activeDays.reduce((a, b) => a + b.complianceScore, 0) / loggedDaysCount) : 0;
  const avgCalories = loggedDaysCount > 0 ? Math.round(activeDays.reduce((a, b) => a + b.caloriesConsumed, 0) / loggedDaysCount) : 0;
  const avgProtein = loggedDaysCount > 0 ? Math.round(activeDays.reduce((a, b) => a + b.proteinConsumed, 0) / loggedDaysCount) : 0;

  const [isGenerating, setIsGenerating] = useState(false);
  const [insights, setInsights] = useState<{title: string, body: string, type: 'positive' | 'warning' | 'negative'}[] | null>(null);

  const [isCoachExpanded, setIsCoachExpanded] = useState(false);

  const aiCoachData = useMemo(() => generateCoachData(last7Days, loggedDaysCount), [last7Days, loggedDaysCount]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pb-[100px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D4FF00] animate-spin" />
      </div>
    );
  }

  return (
    <Profiler id="WeeklyReportPage" onRender={onRenderCallback}>
      <div className="page-enter pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(100px+env(safe-area-inset-bottom))] min-h-[100dvh] bg-[#0A0A0A] px-4">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-10 sticky top-[env(safe-area-inset-top)] z-30">
          <button onClick={() => navigate("/dashboard")} className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.03)] flex items-center justify-center transition-colors hover:bg-[rgba(255,255,255,0.1)]">
            <ChevronLeft size={20} className="text-white" />
          </button>
          <h1 className="text-[22px] font-semibold tracking-tight text-white tracking-tight">Weekly Report</h1>
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
            <div className="text-[15px] text-[rgba(235,235,245,0.6)] leading-relaxed mb-6 max-w-[240px] leading-relaxed">
              Log your meals for at least 3 days this week to generate accurate insights.
            </div>
            <div className="bg-[rgba(212,255,0,0.1)] border border-[rgba(212,255,0,0.2)] text-[#D4FF00] px-4 py-2 rounded-full text-[12px] font-semibold uppercase tracking-wider">
              {loggedDaysCount} logged so far
            </div>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="show">
            
            {/* Stats Overview Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <motion.div variants={itemVariants} className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-[24px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-2xl flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4FF00] opacity-[0.03] blur-2xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
                <div className="text-[12px] uppercase tracking-[0.05em] font-medium text-[rgba(255,255,255,0.5)] mb-2 font-semibold">Avg Compliance</div>
                <div className="text-[56px] font-bold text-white tracking-[-0.04em] leading-none mb-2">{avgCompliance}%</div>
              </motion.div>
              
              <div className="flex flex-col gap-3">
                <motion.div variants={itemVariants} className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-[24px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-2xl flex-1 flex flex-col justify-center">
                  <div className="text-[11px] uppercase tracking-[0.05em] font-medium text-[rgba(255,255,255,0.5)] mb-1 font-semibold">Avg Calories</div>
                  <div className="text-[24px] font-bold text-white tracking-tight">{avgCalories} <span className="text-[13px] text-[rgba(235,235,245,0.5)] font-normal">kcal</span></div>
                </motion.div>
                <motion.div variants={itemVariants} className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-[24px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-2xl flex-1 flex flex-col justify-center">
                  <div className="text-[11px] uppercase tracking-[0.05em] font-medium text-[rgba(255,255,255,0.5)] mb-1 font-semibold">Avg Protein</div>
                  <div className="text-[24px] font-bold text-white tracking-tight">{avgProtein} <span className="text-[13px] text-[rgba(235,235,245,0.5)] font-normal">g</span></div>
                </motion.div>
              </div>
            </div>

            {/* AI Coach Summary (NEW SECTION) */}
            {aiCoachData && (
              <motion.div variants={itemVariants} className="mb-10">
                <div className="bg-[rgba(30,30,30,0.5)] border border-[rgba(255,255,255,0.05)] rounded-[24px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-3xl relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
                  {/* Subtle glowing accent */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4FF00] opacity-[0.04] blur-3xl rounded-full translate-x-1/3 -translate-y-1/3"></div>
                  
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <h2 className="text-[13px] font-semibold text-[rgba(235,235,245,0.6)] tracking-[0.05em] uppercase flex items-center gap-2">
                      AI Coach Summary
                    </h2>
                    <div className="flex items-center gap-1.5 bg-[rgba(212,255,0,0.1)] px-2.5 py-1 rounded-full">
                      <Sparkles size={12} className="text-[#D4FF00]" />
                      <span className="text-[10px] font-semibold text-[#D4FF00] uppercase tracking-wider">Powered by AI</span>
                    </div>
                  </div>

                  <div className="relative z-10">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <motion.div 
                          initial={false}
                          animate={{ height: 'auto' }}
                          className="overflow-hidden"
                        >
                          <p className="text-[15px] text-white leading-relaxed leading-relaxed mb-3">
                            {aiCoachData.summaryShort}
                          </p>
                          <AnimatePresence>
                            {isCoachExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3, type: "spring", bounce: 0 }}
                              >
                                <p className="text-[15px] text-[rgba(235,235,245,0.6)] leading-relaxed leading-relaxed pt-2 border-t border-[rgba(255,255,255,0.06)]">
                                  {aiCoachData.summaryLong}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                        
                        <button 
                          onClick={() => setIsCoachExpanded(!isCoachExpanded)}
                          className="flex items-center gap-1 text-[13px] font-medium text-[#D4FF00] hover:text-[#e2ff4d] transition-colors"
                        >
                          {isCoachExpanded ? 'Show less' : 'Read more'}
                          {isCoachExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>
                      
                      {/* Placeholder for AI avatar/icon */}
                      <div className="w-16 h-16 shrink-0 rounded-[24px] bg-gradient-to-br from-[rgba(212,255,0,0.15)] to-[rgba(212,255,0,0.02)] border border-[rgba(212,255,0,0.1)] flex items-center justify-center relative shadow-[0_0_20px_rgba(212,255,0,0.1)]">
                        <Sparkles size={28} className="text-[#D4FF00] opacity-80" />
                        <div className="absolute inset-0 rounded-[24px] border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Daily Compliance Chart */}
            <motion.div variants={itemVariants} className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-[24px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-2xl mb-10">
               <div className="flex items-center gap-2 mb-6">
                 <TrendingUp size={16} className="text-[#D4FF00]" />
                 <h2 className="text-[18px] font-semibold tracking-tight text-white tracking-tight">Daily Breakdown</h2>
               </div>
               
               <div className="flex flex-col gap-4">
                 {last7Days.map((day, i) => {
                   const [y, m, d] = day.date.split('-').map(Number);
                   const localDate = new Date(y, m - 1, d);
                   const dayLabel = localDate.toLocaleDateString('en-US', { weekday: 'short' });
                   const pct = Math.min(Math.max(day.complianceScore, 0), 100);
                   const barColor = pct >= 80 ? '#D4FF00' : (pct >= 50 ? '#fbbf24' : '#FF4D1C');
                   
                   return (
                     <div key={day.date} className="flex items-center gap-4">
                       <div className="text-[12px] font-medium text-[rgba(255,255,255,0.5)] w-8">{dayLabel}</div>
                       <div className="flex-1 h-3 rounded-full overflow-hidden bg-[rgba(255,255,255,0.03)] relative">
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
              <motion.div variants={itemVariants} className="flex flex-col gap-4 mb-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[#D4FF00] animate-pulse" />
                  <h2 className="text-[18px] font-semibold tracking-tight text-white tracking-tight">AI Report Generated</h2>
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
                        className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-[24px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-2xl relative overflow-hidden"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1 opacity-80" style={{ backgroundColor: color }} />
                        <div className="flex items-start gap-4">
                          <div className="mt-0.5 opacity-80" style={{ color }}>
                            <Icon size={18} />
                          </div>
                          <div>
                            <div className="text-[18px] font-semibold tracking-tight text-white tracking-tight mb-1">{insight.title}</div>
                            <div className="text-[15px] text-[rgba(235,235,245,0.6)] leading-relaxed leading-relaxed font-medium">{insight.body}</div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div variants={itemVariants} className="mt-8 mb-10">
                 <button
                   onClick={handleGenerate}
                   disabled={isGenerating}
                   className="w-full bg-white text-[#0A0A0A] font-semibold text-[16px] rounded-[100px] py-[16px] shadow-[0_4px_24px_rgba(255,255,255,0.15)] active:scale-[0.97] transition-all duration-200 flex items-center justify-center relative overflow-hidden transition-transform active:scale-[0.98]"
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
                 <p className="text-center text-[13px] text-[rgba(235,235,245,0.5)] mt-4 font-medium">
                   Report is generated locally using your actual logged data.
                 </p>
              </motion.div>
            )}

            {/* AI Recommendations (NEW SECTION) */}
            {aiCoachData && (
              <motion.div variants={itemVariants} className="mb-12">
                <div className="flex items-center justify-between mb-4 px-1">
                  <h2 className="text-[13px] font-semibold text-[rgba(235,235,245,0.6)] tracking-[0.05em] uppercase">Recommendations</h2>
                  <span className="text-[13px] text-[rgba(235,235,245,0.5)]">Based on your data</span>
                </div>
                
                <div className="flex flex-col gap-3">
                  {aiCoachData.recommendations.map((rec, i) => {
                    let impactColor = "text-[#D4FF00]";
                    let impactBg = "bg-[rgba(212,255,0,0.1)]";
                    
                    if (rec.impact === "Medium Impact") {
                      impactColor = "text-amber-400";
                      impactBg = "bg-amber-400/10";
                    } else if (rec.impact === "Maintain") {
                      impactColor = "text-blue-400";
                      impactBg = "bg-blue-400/10";
                    } else if (rec.impact === "Low Priority") {
                      impactColor = "text-[rgba(235,235,245,0.5)]";
                      impactBg = "bg-gray-400/10";
                    }

                    return (
                      <motion.div 
                        key={rec.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 + (i * 0.1), type: "spring", stiffness: 200, damping: 20 }}
                        whileHover={{ y: -2, transition: { duration: 0.2 } }}
                        className="bg-[rgba(30,30,30,0.5)] border border-[rgba(255,255,255,0.05)] rounded-[24px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-3xl flex gap-4 transition-colors hover:bg-[rgba(255,255,255,0.02)]"
                      >
                        {/* Number Circle */}
                        <div className="w-7 h-7 shrink-0 rounded-full bg-[#D4FF00] flex items-center justify-center shadow-[0_0_15px_rgba(212,255,0,0.3)]">
                          <span className="text-black text-[13px] font-bold">{i + 1}</span>
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="text-[18px] font-semibold tracking-tight text-white tracking-tight mb-2">{rec.title}</h3>
                          <p className="text-[15px] text-[rgba(235,235,245,0.6)] leading-relaxed leading-relaxed mb-4">
                            {rec.description}
                          </p>
                          <div className={cn("inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-semibold tracking-wide", impactColor, impactBg)}>
                            {rec.impact}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

          </motion.div>
        )}
      </div>
    </Profiler>
  );
}
