import { useCalculatedProfile } from '@/shared/hooks/useCalculatedProfile';
import { PerfProfiler } from '@/shared/utils/perfDebug';
import React, { useState, useMemo} from 'react';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/features/profile/services/profileService';
import { mealService } from '@/features/nutrition/services/mealService';
import { reportService } from '../services/reportService';
import { ChevronLeft, ChevronRight, CheckCircle2, TrendingUp, AlertTriangle, Loader2, Sparkles, ChevronDown, ChevronUp, Flame, Leaf } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DailyActivityData } from '@/shared/types/activity';
import { cn } from "@/shared/utils/utils";
import { useNavigate } from 'react-router-dom';
import { haptics } from '@/shared/utils/haptics';
import { calculateDailyScore } from '@/shared/utils/complianceEngine';
import { weightService } from '@/features/progress/services/weightService';
import { analytics } from '@/shared/utils/analytics';
import { useEffect } from 'react';
import { useNetworkConnectivity } from '@/shared/hooks/useNetworkConnectivity';
import { WeeklyReportSkeleton } from '@/shared/components/Skeletons';

function getLocalDateString(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('en-US', { weekday: 'short' });

// -- AI Logic (Deterministic) --

function generateCoachData(days: DailyActivityData[], loggedCount: number) {
  if (loggedCount < 7) return null;

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
  const navigate = useNavigate();

  useEffect(() => {
    analytics.trackEvent('Weekly Report Viewed');
  }, []);

  const { data: profile, isLoading: profileLoading } = useQuery({ queryKey: ['profile'], queryFn: () => profileService.getProfile() });
  const { data: goal, isLoading: goalLoading } = useQuery({ queryKey: ['goal'], queryFn: () => profileService.getGoal() });
  const { data: meals = [], isLoading: mealsLoading } = useQuery({ queryKey: ['meals', 'month'], queryFn: () => mealService.getMeals({ days: 35, limit: 2000 }) });
  const { data: dailyMetrics = [], isLoading: metricsLoading } = useQuery({ queryKey: ['dailyMetrics'], queryFn: () => reportService.getDailyMetrics() });
  const { data: weightLogs = [] } = useQuery({ queryKey: ['weightLogs'], queryFn: () => weightService.getWeightLogs() });

  const { profileData: calculatedData } = useCalculatedProfile();

  const isLoading = profileLoading || goalLoading || mealsLoading || metricsLoading;
  const isOnline = useNetworkConnectivity();

  const calorieGoal = calculatedData?.dailyCalorieGoal || 2000;
  const proteinGoal = calculatedData?.targetMacros?.protein || 150;
  const today = new Date();
  // End the window yesterday so today's still-logging day doesn't skew the report.
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const last7Days: DailyActivityData[] = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(yesterday);
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
        fatTarget: calculatedData?.targetMacros?.fat ?? 60,
        carbsConsumed: dayMeals.reduce((a, m) => a + m.carbs, 0),
        carbsTarget: calculatedData?.targetMacros?.carbs ?? 220,
        complianceScore,
      };
    });
  }, [meals, dailyMetrics, calorieGoal, proteinGoal, yesterday, weightLogs]);

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
    if (!isOnline) {
      return (
        <div className="min-h-screen bg-[#0A0A0A] pb-[100px] flex flex-col items-center justify-center px-6 text-center">
          <AlertTriangle className="w-12 h-12 text-[rgba(255,255,255,0.2)] mb-4" />
          <h2 className="text-[18px] font-semibold text-white mb-2">You're offline</h2>
          <p className="text-[14px] text-[rgba(255,255,255,0.6)]">
            Connect to the internet to load your weekly report for the first time.
          </p>
          <button onClick={() => navigate('/dashboard')} className="mt-8 text-[#D4FF00] font-medium text-[15px]">
            Return to Dashboard
          </button>
        </div>
      );
    }
    return <WeeklyReportSkeleton />;
  }

  const weekLabel = (() => {
    if (last7Days.length < 7) return '';
    const fmt = (s: string) => {
      const [y, m, d] = s.split('-').map(Number);
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(y, m - 1, d));
    };
    const year = last7Days[6].date.split('-')[0];
    return `${fmt(last7Days[0].date)} – ${fmt(last7Days[6].date)}, ${year}`;
  })();

  return (
    <PerfProfiler id="WeeklyReportPage">
      <div className="min-h-[100dvh] bg-[#0A0A0A] px-5 pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(100px+env(safe-area-inset-bottom))]">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            aria-label="Back"
            className="w-11 h-11 rounded-full flex items-center justify-center bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-white transition-colors hover:bg-[rgba(255,255,255,0.08)]"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-center flex-1">
            <h1 className="text-[22px] font-semibold text-white tracking-tight">
              Weekly Report
            </h1>
            <p className="text-[13px] text-zinc-500 mt-0.5">
              {weekLabel}
            </p>
          </div>
          <div className="w-11" />
        </div>

        {loggedDaysCount < 7 ? (
          <motion.div initial={{opacity: 0, scale: 0.95}} animate={{opacity: 1, scale: 1}} className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 mb-6 relative flex items-center justify-center">
               <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                 <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                 <circle cx="50" cy="50" r="46" fill="none" stroke="#D4FF00" strokeWidth="8" strokeDasharray="289" strokeDashoffset={289 - (289 * (loggedDaysCount/7))} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
               </svg>
               <div className="absolute inset-0 flex items-center justify-center text-[24px] font-bold text-white">{loggedDaysCount}/7</div>
            </div>
            <div className="text-[17px] font-semibold text-white mb-2 tracking-tight">Complete 7 days to unlock your first report.</div>
            <div className="text-[14px] text-[rgba(235,235,245,0.6)] leading-relaxed mb-6 max-w-[240px]">
              Keep logging your meals daily to generate accurate, personalized insights.
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-[rgba(212,255,0,0.1)] hover:bg-[rgba(212,255,0,0.2)] border border-[rgba(212,255,0,0.2)] text-[#D4FF00] px-6 py-3 rounded-full text-[14px] font-bold tracking-wide transition-colors"
            >
              Continue Tracking
            </button>
          </motion.div>
        ) : (
          <>
            {/* Consistency card */}
            <div className="rounded-[24px] border border-[rgba(255,255,255,0.06)] p-5 mb-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="flex items-center gap-5">
                {/* Ring */}
                <div className="relative w-[128px] h-[128px] shrink-0">
                  <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#D4FF00" strokeWidth="7" strokeLinecap="round" strokeDasharray={2 * Math.PI * 42} strokeDashoffset={(2 * Math.PI * 42) * (1 - avgCompliance / 100)} style={{ transition: 'stroke-dashoffset 900ms ease', filter: 'drop-shadow(0 0 10px rgba(212,255,0,0.35))' }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-[36px] font-bold text-white tracking-tighter leading-none tabular-nums">{avgCompliance}%</div>
                    <div className="text-[10px] uppercase tracking-wider text-zinc-500 mt-1 text-center leading-tight">Avg<br/>Compliance</div>
                  </div>
                </div>

                {/* Right side */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-[16px] font-semibold text-white">Weekly Consistency</h2>
                    <ChevronRight size={18} className="text-zinc-500" />
                  </div>
                  <p className="text-[13px] text-zinc-400 leading-snug mb-4">
                    You stayed on track for {avgCompliance}% of your goal this week.
                  </p>

                  {/* 7-day mini bars */}
                  <div className="grid grid-cols-7 gap-1.5 items-end h-12">
                    {last7Days.map((day, i) => {
                      const h = Math.max(10, Math.min(100, day.complianceScore));
                      return (
                        <div key={i} className="w-full rounded-md" style={{ height: `${h}%`, background: h >= 60 ? '#D4FF00' : h >= 30 ? 'rgba(212,255,0,0.45)' : 'rgba(255,255,255,0.10)' }} />
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-7 gap-1.5 mt-2">
                    {['M','T','W','T','F','S','S'].map((d, i) => (
                      <div key={i} className="text-center text-[10px] text-zinc-600">{d}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>            {/* Two metric cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Calories */}
              <div className="rounded-[20px] border border-[rgba(255,255,255,0.06)] p-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(255,77,28,0.10)' }}>
                    <Flame size={16} className="text-[#FF4D1C]" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Avg Calories</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[26px] font-bold text-white tabular-nums tracking-tight">{avgCalories}</span>
                  <span className="text-[12px] text-zinc-500 font-medium">kcal</span>
                </div>
              </div>

              {/* Protein */}
              <div className="rounded-[20px] border border-[rgba(255,255,255,0.06)] p-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(212,255,0,0.10)' }}>
                    <Leaf size={16} className="text-[#D4FF00]" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Avg Protein</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[26px] font-bold text-white tabular-nums tracking-tight">{avgProtein}</span>
                  <span className="text-[12px] text-zinc-500 font-medium">g</span>
                </div>
              </div>
            </div>

            {/* AI Coach card */}
            {aiCoachData && (
              <div className="rounded-[24px] border border-[rgba(255,255,255,0.06)] p-5 mb-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-[#D4FF00]" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">AI Coach Summary</span>
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: 'rgba(212,255,0,0.10)' }}>
                    <Sparkles size={11} className="text-[#D4FF00]" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4FF00]">Powered by AI</span>
                  </div>
                </div>
                <p className="text-[15px] text-white leading-relaxed mb-4">
                  {isCoachExpanded ? aiCoachData.summaryLong : aiCoachData.summaryShort}
                </p>
                <button onClick={() => setIsCoachExpanded(!isCoachExpanded)} className="flex items-center gap-2 text-[14px] font-semibold text-[#D4FF00]">
                  {isCoachExpanded ? 'Show less' : 'Read more'}
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </PerfProfiler>
  );
            {/* Two metric cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Calories */}
              <div className="rounded-[20px] border border-[rgba(255,255,255,0.06)] p-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(255,77,28,0.10)' }}>
                    <Flame size={16} className="text-[#FF4D1C]" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Avg Calories</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[26px] font-bold text-white tabular-nums tracking-tight">{avgCalories}</span>
                  <span className="text-[12px] text-zinc-500 font-medium">kcal</span>
                </div>
              </div>
              {/* Protein */}
              <div className="rounded-[20px] border border-[rgba(255,255,255,0.06)] p-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(212,255,0,0.10)' }}>
                    <Leaf size={16} className="text-[#D4FF00]" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Avg Protein</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[26px] font-bold text-white tabular-nums tracking-tight">{avgProtein}</span>
                  <span className="text-[12px] text-zinc-500 font-medium">g</span>
                </div>
              </div>
            </div>
}
