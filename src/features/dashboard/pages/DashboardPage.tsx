import React, { Profiler, useEffect, useState, useRef, memo } from 'react';
import { onRenderCallback, useRenderTracker } from '@/shared/utils/perfDebug';
import { useAppStore } from "@/app/store";
import { reportService } from "@/features/reports/services/reportService";
import { calculateCurrentDailyStreak, isDailyGoalMet, toUtcDay } from "@/shared/utils/streaks";
import { Target, Footprints, Flame, Sparkles, ChevronRight, Activity, TrendingDown, TrendingUp, Plus, Droplet, Wheat, Dna, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useCalculatedProfile } from "@/shared/hooks/useCalculatedProfile";
import { mealService } from "@/features/nutrition/services/mealService";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";

const AnimatedNumber = memo(function AnimatedNumber({
  value,
  duration = 800,
}: {
  value: number;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let observer: IntersectionObserver;
    let animationFrameId: number;
    let start: number | null = null;
    let lastUpdate = 0;

    const update = (time: number) => {
      if (!start) start = time;
      const elapsed = time - start;
      
      if (time - lastUpdate > 32 || elapsed >= duration) {
        lastUpdate = time;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4);
        const nextValue = Math.round(ease * value);
        setDisplayValue(prev => (prev !== nextValue ? nextValue : prev));
      }

      if (elapsed < duration) {
        animationFrameId = requestAnimationFrame(update);
      }
    };

    const startAnimation = () => {
      start = null;
      lastUpdate = 0;
      animationFrameId = requestAnimationFrame(update);
    };

    if (elementRef.current) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            startAnimation();
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(elementRef.current);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (observer) observer.disconnect();
    };
  }, [value, duration]);

  return <span ref={elementRef}>{displayValue}</span>;
});

export function DashboardPage() {
  useRenderTracker('DashboardPage');

  const { data: metrics = [] } = useQuery({ queryKey: ["dailyMetrics"], queryFn: () => reportService.getDailyMetrics() });
  const currentStreak = calculateCurrentDailyStreak(metrics);
  
  const { profileData, isLoading } = useCalculatedProfile();
  const navigate = useNavigate();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    data: meals,
    isError: isMealsError,
    refetch: refetchMeals,
  } = useQuery({
    queryKey: ["meals", "today"],
    queryFn: () => mealService.getTodaysMeals(),
  });

  const name = profileData?.name || "User";
  const proteinTarget = Math.round(profileData?.proteinMid || 0);
  const dailyTargetKcal = Math.round(profileData?.dailyCalorieGoal || 0);
  const fatTarget = Math.round(profileData?.fatMid || 0);
  const carbsTarget = Math.round(profileData?.carbMid || 0);

  const weightKg = profileData?.weightKg || 0;
  const targetWeightKg = profileData?.targetWeightKg || 0;
  const currentBf = profileData?.currentBodyFatPct || 0;
  const targetBf = profileData?.targetBodyFatPct || 0;

  const todaysMeals = meals || [];
  const eatenKcal = Math.round(todaysMeals.reduce((acc, m) => acc + m.calories, 0));
  const eatenProtein = Math.round(todaysMeals.reduce((acc, m) => acc + m.protein, 0));
  const eatenFat = Math.round(todaysMeals.reduce((acc, m) => acc + m.fat, 0));
  const eatenCarbs = Math.round(todaysMeals.reduce((acc, m) => acc + m.carbs, 0));

  const remainingKcal = dailyTargetKcal ? dailyTargetKcal - eatenKcal : 0;
  const remainingProtein = proteinTarget ? proteinTarget - eatenProtein : 0;

  const dateString = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const calPct = dailyTargetKcal ? Math.min(eatenKcal / dailyTargetKcal, 1) : 0;
  const proPct = proteinTarget ? Math.min(eatenProtein / proteinTarget, 1) : 0;
  const fatPct = fatTarget ? Math.min(eatenFat / fatTarget, 1) : 0;
  const carbPct = carbsTarget ? Math.min(eatenCarbs / carbsTarget, 1) : 0;

  const completionScore = dailyTargetKcal ? Math.round(((calPct + proPct + fatPct + carbPct) / 4) * 100) : 0;

  const getAiInsight = () => {
    if (completionScore >= 100) return "Incredible work today. You've hit your nutritional targets perfectly. Keep resting and hydrating.";
    if (eatenKcal === 0) return "Good morning! Start your day strong with a protein-rich breakfast to set the tone.";
    if (proPct < calPct) return "You're consuming calories faster than protein. Prioritize a high-protein source in your next meal.";
    if (remainingKcal < 300 && remainingProtein > 30) return "Calories are running low but protein is still needed. Opt for lean sources like egg whites or a shake.";
    return "You're consuming calories better than yesterday. Maintain a high-protein stance in your next meal.";
  };

  const ringCircumference = 2 * Math.PI * 42;
  const ringOffset = ringCircumference - calPct * ringCircumference;
  
  const scoreCircumference = 2 * Math.PI * 26;
  const scoreOffset = scoreCircumference - (completionScore / 100) * scoreCircumference;

  return (
    <Profiler id="DashboardPage" onRender={onRenderCallback}>
      <div className="page-enter px-4 pb-[calc(80px+env(safe-area-inset-bottom))] pt-6 space-y-4">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-[32px] font-semibold tracking-tight text-white flex items-center gap-2 leading-tight">
              Ready, {name.split(' ')[0]}!
            </h2>
            <div className="text-[14px] font-medium text-[rgba(235,235,245,0.5)] mt-0.5">{dateString}</div>
          </div>
          <div className="flex items-center gap-1.5 mt-2 bg-[rgba(255,255,255,0.05)] px-3 py-1.5 rounded-full border border-[rgba(255,255,255,0.05)] shadow-sm">
            <Flame size={16} className={currentStreak > 0 ? "text-[#FF4D1C]" : "text-[rgba(235,235,245,0.3)]"} strokeWidth={2.5} />
            <span className="text-[15px] font-bold text-white">{currentStreak}</span>
          </div>
        </div>

        {isMealsError ? (
          <div className="rounded-[24px] border border-red-500/30 bg-red-500/10 p-5 flex flex-col items-center justify-center text-center backdrop-blur-xl">
            <div className="text-red-400 font-medium mb-3">Unable to sync today's data</div>
            <button onClick={() => refetchMeals()} className="px-5 py-2.5 rounded-full bg-red-500/20 text-red-400 font-bold text-sm tracking-wide">
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* AI Insight Card */}
            <motion.div 
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              className="rounded-[20px] p-5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] shadow-sm backdrop-blur-xl"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-[11px] font-bold text-[#D4FF00] tracking-widest uppercase">Today's Mission</span>
                <Target size={14} className="text-[#D4FF00]" />
              </div>
              <p className="text-[14px] font-medium text-[rgba(255,255,255,0.85)] leading-relaxed">
                {getAiInsight()}
              </p>
            </motion.div>

            {/* Calories Hero */}
            <motion.div 
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/calorie')}
              className="rounded-[24px] p-6 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] shadow-sm backdrop-blur-xl cursor-pointer"
            >
              <div className="flex justify-between items-center mb-5">
                <div className="text-[12px] font-semibold text-[rgba(235,235,245,0.5)] uppercase tracking-widest">Calories</div>
                <ChevronRight size={16} className="text-[rgba(235,235,245,0.4)]" />
              </div>
              
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-[48px] font-bold text-white tracking-tighter leading-none"><AnimatedNumber value={eatenKcal} duration={1000} /></span>
                <span className="text-[20px] font-semibold text-[rgba(235,235,245,0.4)]">/ {dailyTargetKcal}</span>
                <span className="text-[13px] font-medium text-[rgba(235,235,245,0.4)] ml-1 uppercase tracking-widest">kcal</span>
              </div>

              <div className="flex items-center gap-6">
                <div className="relative flex items-center justify-center w-[100px] h-[100px] shrink-0">
                  <svg width="100" height="100" viewBox="0 0 100 100" className="transform -rotate-90">
                    <circle cx="50" cy="50" r="42" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                    <circle cx="50" cy="50" r="42" fill="transparent" stroke="#D4FF00" strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={ringCircumference}
                      style={{ strokeDashoffset: mounted ? ringOffset : ringCircumference, transition: "stroke-dashoffset 1s cubic-bezier(0.34,1.56,0.64,1) 0.2s" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-[22px] font-bold text-white tracking-tighter leading-none">
                      {Math.round((calPct) * 100)}%
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-[32px] font-bold text-white tracking-tight leading-none"><AnimatedNumber value={remainingKcal > 0 ? remainingKcal : 0} duration={800} /></span>
                    <span className="text-[14px] font-medium text-white/60">kcal</span>
                  </div>
                  <div className="text-[14px] font-medium text-white/50 mb-3">Remaining</div>
                  <div className="flex items-center gap-1.5">
                    <Flame size={14} className={remainingKcal >= 0 ? "text-[#D4FF00]" : "text-[#FF4D1C]"} />
                    <span className={`text-[12px] font-bold tracking-wide uppercase ${remainingKcal >= 0 ? 'text-[#D4FF00]' : 'text-[#FF4D1C]'}`}>{remainingKcal >= 0 ? 'On track' : 'Over limit'}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Macronutrients */}
            <motion.div 
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              className="rounded-[24px] p-6 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] shadow-sm backdrop-blur-xl"
            >
              <div className="flex justify-between items-center mb-7">
                <div className="text-[12px] font-semibold text-[rgba(235,235,245,0.5)] uppercase tracking-widest">Macronutrients</div>
                <div className="text-[12px] font-bold text-[#D4FF00] flex items-center gap-1 cursor-pointer tracking-wide" onClick={() => navigate('/protein')}>
                  Details <ChevronRight size={14} />
                </div>
              </div>

              <div className="flex flex-col gap-7">
                {/* Protein */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-[12px] bg-[rgba(55,138,221,0.1)] flex items-center justify-center">
                         <Dna size={16} className="text-[#378ADD]" />
                      </div>
                      <span className="text-[15px] font-bold text-white tracking-tight">Protein</span>
                    </div>
                    <div className="text-[15px] font-bold tracking-tight">
                      <span className="text-white">{eatenProtein}</span>
                      <span className="text-[rgba(235,235,245,0.4)]"> / {proteinTarget}g</span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[rgba(255,255,255,0.05)] overflow-hidden shadow-inner">
                    <div className="h-full bg-[#378ADD] rounded-full" style={{ width: mounted ? `${proPct * 100}%` : '0%', transition: "width 1s cubic-bezier(0.34,1.56,0.64,1) 0.3s" }} />
                  </div>
                </div>

                {/* Fat */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-[12px] bg-[rgba(255,255,255,0.1)] flex items-center justify-center">
                         <Droplet size={16} className="text-white" />
                      </div>
                      <span className="text-[15px] font-bold text-white tracking-tight">Fat</span>
                    </div>
                    <div className="text-[15px] font-bold tracking-tight">
                      <span className="text-white">{eatenFat}</span>
                      <span className="text-[rgba(235,235,245,0.4)]"> / {fatTarget}g</span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[rgba(255,255,255,0.05)] overflow-hidden shadow-inner">
                    <div className="h-full bg-white rounded-full" style={{ width: mounted ? `${fatPct * 100}%` : '0%', transition: "width 1s cubic-bezier(0.34,1.56,0.64,1) 0.4s" }} />
                  </div>
                </div>

                {/* Carbs */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-[12px] bg-[rgba(255,255,255,0.1)] flex items-center justify-center">
                         <Wheat size={16} className="text-white" />
                      </div>
                      <span className="text-[15px] font-bold text-white tracking-tight">Carbs</span>
                    </div>
                    <div className="text-[15px] font-bold tracking-tight">
                      <span className="text-white">{eatenCarbs}</span>
                      <span className="text-[rgba(235,235,245,0.4)]"> / {carbsTarget}g</span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[rgba(255,255,255,0.05)] overflow-hidden shadow-inner">
                    <div className="h-full bg-white rounded-full" style={{ width: mounted ? `${carbPct * 100}%` : '0%', transition: "width 1s cubic-bezier(0.34,1.56,0.64,1) 0.5s" }} />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Weight Progress & Next Meal Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Weight Progress */}
              <motion.div 
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/progress')}
                className="rounded-[24px] p-5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] shadow-sm backdrop-blur-xl cursor-pointer flex flex-col justify-between h-[140px]"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="text-[11px] font-bold text-[rgba(235,235,245,0.5)] tracking-widest uppercase">Weight</div>
                  <Activity size={16} className="text-[#378ADD]" />
                </div>
                <div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-[32px] font-bold tracking-tighter text-white leading-none">
                      {weightKg > 0 ? weightKg : '--'}
                    </span>
                    <span className="text-[14px] font-semibold text-[rgba(235,235,245,0.4)]">kg</span>
                  </div>
                  <div className="text-[12px] font-medium text-[rgba(235,235,245,0.5)] tracking-tight">
                    Target: {targetWeightKg > 0 ? targetWeightKg : '--'} kg
                  </div>
                </div>
              </motion.div>

              {/* Next Meal Suggestion */}
              <motion.div 
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/meals')}
                className="rounded-[24px] p-5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] shadow-sm backdrop-blur-xl cursor-pointer flex flex-col justify-between h-[140px] relative"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="text-[11px] font-bold text-[rgba(235,235,245,0.5)] tracking-widest uppercase">Up Next</div>
                  <TrendingUp size={16} className="text-[#D4FF00]" />
                </div>
                <div>
                  <div className="text-[15px] font-bold text-white tracking-tight leading-snug mb-2 pr-10">
                    {remainingProtein <= 0 ? "Goal met!" : (remainingProtein > 30 ? "Chicken Breast" : "Greek Yogurt")}
                  </div>
                  {remainingProtein > 0 && (
                     <div className="inline-block bg-[rgba(212,255,0,0.15)] text-[#D4FF00] text-[10px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full">
                       ~{remainingProtein > 30 ? '350' : '200'} kcal
                     </div>
                  )}
                </div>
                <div className="absolute bottom-5 right-5 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(255,255,255,0.15)]">
                  <Plus size={20} strokeWidth={2.5} color="#000" />
                </div>
              </motion.div>
            </div>

            {/* Daily Score */}
            <motion.div 
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} 
              className="rounded-[24px] p-6 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] shadow-sm backdrop-blur-xl flex items-center justify-between"
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 mb-2">
                   <Star size={14} className="text-[#D4FF00]" />
                   <span className="text-[11px] font-bold text-[rgba(235,235,245,0.5)] tracking-widest uppercase">Daily Score</span>
                </div>
                <div className="flex items-baseline gap-1 mb-1.5">
                  <span className="text-[44px] tracking-tighter font-bold text-white leading-none">
                    <AnimatedNumber value={completionScore} duration={1000} />
                  </span>
                  <span className="text-[18px] font-semibold text-[rgba(235,235,245,0.4)]">/ 100</span>
                </div>
                <div className="text-[14px] font-medium text-[rgba(235,235,245,0.7)] tracking-tight">
                  {completionScore > 80 ? "Great job! Keep going." : "Almost there, stay focused."}
                </div>
              </div>
              
              <div className="relative flex items-center justify-center w-[72px] h-[72px] shrink-0">
                  <svg width="72" height="72" viewBox="0 0 72 72" className="transform -rotate-90">
                    <circle cx="36" cy="36" r="32" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                    <circle cx="36" cy="36" r="32" fill="transparent" stroke="#D4FF00" strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={scoreCircumference * (32/26)} 
                      style={{ strokeDashoffset: mounted ? (scoreCircumference - (completionScore / 100) * scoreCircumference) * (32/26) : scoreCircumference * (32/26), transition: "stroke-dashoffset 1s cubic-bezier(0.34,1.56,0.64,1) 0.2s" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Star size={20} className="text-[rgba(255,255,255,0.8)]" fill={completionScore >= 100 ? "#D4FF00" : "transparent"} />
                  </div>
              </div>
            </motion.div>
          </>
        )}

      </div>
      
      </Profiler>
  );
}