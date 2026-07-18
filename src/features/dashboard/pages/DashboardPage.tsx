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
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-[28px] font-bold tracking-tight text-white flex items-center gap-2 leading-tight">
              Ready, {name.split(' ')[0]}! <span className="text-2xl">👋</span>
            </h2>
            <div className="text-[14px] text-white/50 mt-1">{dateString}</div>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <Flame size={20} className={currentStreak > 0 ? "text-[#FF4D1C]" : "text-white/20"} strokeWidth={2.5} />
            <span className="text-[20px] font-bold text-white">{currentStreak}</span>
          </div>
        </div>

        {isMealsError ? (
          <div className="rounded-[24px] border border-red-500/30 bg-red-500/10 p-5 flex flex-col items-center justify-center text-center">
            <div className="text-red-400 font-medium mb-3">Unable to sync today's data</div>
            <button onClick={() => refetchMeals()} className="px-4 py-2 rounded-full bg-red-500/20 text-red-400 font-medium text-sm">
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* AI Insight Card */}
            <motion.div 
              whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
              className="rounded-[20px] p-4 bg-[#1C1C1E] border border-white/5 shadow-[0_2px_12px_rgba(0,0,0,0.1)]"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-bold text-[#D4FF00] tracking-widest uppercase">Today's Mission</span>
                <Target size={14} className="text-[#D4FF00]" />
              </div>
              <p className="text-[14px] text-white/90 leading-relaxed">
                {getAiInsight()}
              </p>
            </motion.div>

            {/* Calories Hero */}
            <motion.div 
              whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/calorie')}
              className="rounded-[24px] p-6 bg-[#1C1C1E] border border-white/5 shadow-[0_2px_12px_rgba(0,0,0,0.1)] cursor-pointer"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="text-[12px] font-semibold text-white uppercase tracking-wider">Calories</div>
                <ChevronRight size={16} className="text-white/40" />
              </div>
              
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-[42px] font-bold text-[#D4FF00] tracking-tighter leading-none"><AnimatedNumber value={eatenKcal} duration={1000} /></span>
                <span className="text-[20px] font-bold text-white/40">/ {dailyTargetKcal}</span>
                <span className="text-[14px] font-medium text-white/40 ml-1">kcal</span>
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
                    <div className="text-[32px] font-bold text-white tracking-tight leading-none">
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
                    <span className={`text-[12px] font-medium ${remainingKcal >= 0 ? 'text-[#D4FF00]' : 'text-[#FF4D1C]'}`}>{remainingKcal >= 0 ? 'On track' : 'Over limit'}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Macronutrients */}
            <motion.div 
              whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
              className="rounded-[24px] p-5 bg-[#1C1C1E] border border-white/5 shadow-[0_2px_12px_rgba(0,0,0,0.1)]"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="text-[12px] font-semibold text-white uppercase tracking-wider">Macronutrients</div>
                <div className="text-[12px] text-[#D4FF00] flex items-center gap-1 cursor-pointer" onClick={() => navigate('/protein')}>
                  Details <ChevronRight size={14} />
                </div>
              </div>

              <div className="flex flex-col gap-6">
                {/* Protein */}
                <div>
                  <div className="flex justify-between items-center mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#378ADD]/10 flex items-center justify-center">
                         <Dna size={14} className="text-[#378ADD]" />
                      </div>
                      <span className="text-[15px] font-medium text-white">Protein</span>
                    </div>
                    <div className="text-[14px] font-medium">
                      <span className="text-white">{eatenProtein}</span>
                      <span className="text-white/40"> / {proteinTarget}g</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full bg-[#378ADD] rounded-full" style={{ width: mounted ? `${proPct * 100}%` : '0%', transition: "width 1s cubic-bezier(0.34,1.56,0.64,1) 0.3s" }} />
                  </div>
                </div>

                {/* Fat */}
                <div>
                  <div className="flex justify-between items-center mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#FF4D1C]/10 flex items-center justify-center">
                         <Droplet size={14} className="text-[#FF4D1C]" />
                      </div>
                      <span className="text-[15px] font-medium text-white">Fat</span>
                    </div>
                    <div className="text-[14px] font-medium">
                      <span className="text-white">{eatenFat}</span>
                      <span className="text-white/40"> / {fatTarget}g</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full bg-[#FF4D1C] rounded-full" style={{ width: mounted ? `${fatPct * 100}%` : '0%', transition: "width 1s cubic-bezier(0.34,1.56,0.64,1) 0.4s" }} />
                  </div>
                </div>

                {/* Carbs */}
                <div>
                  <div className="flex justify-between items-center mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#FBBF24]/10 flex items-center justify-center">
                         <Wheat size={14} className="text-[#FBBF24]" />
                      </div>
                      <span className="text-[15px] font-medium text-white">Carbs</span>
                    </div>
                    <div className="text-[14px] font-medium">
                      <span className="text-white">{eatenCarbs}</span>
                      <span className="text-white/40"> / {carbsTarget}g</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full bg-[#FBBF24] rounded-full" style={{ width: mounted ? `${carbPct * 100}%` : '0%', transition: "width 1s cubic-bezier(0.34,1.56,0.64,1) 0.5s" }} />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Weight Progress & Next Meal Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Weight Progress */}
              <motion.div 
                whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/progress')}
                className="rounded-[24px] p-5 bg-[#1C1C1E] border border-white/5 shadow-[0_2px_12px_rgba(0,0,0,0.1)] cursor-pointer flex flex-col justify-between h-[130px]"
              >
                <div className="flex justify-between items-start">
                  <div className="text-[12px] font-semibold text-white/50 tracking-wide uppercase">Weight</div>
                  <Activity size={16} className="text-[#378ADD]" />
                </div>
                <div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-[28px] font-bold tracking-tighter text-white leading-none">
                      {weightKg > 0 ? weightKg : '--'}
                    </span>
                    <span className="text-[14px] font-medium text-white/40">kg</span>
                  </div>
                  <div className="text-[11px] font-medium text-white/40">
                    Target: {targetWeightKg > 0 ? targetWeightKg : '--'} kg
                  </div>
                </div>
              </motion.div>

              {/* Next Meal Suggestion */}
              <motion.div 
                whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/meals')}
                className="rounded-[24px] p-5 bg-[#1C1C1E] border border-white/5 shadow-[0_2px_12px_rgba(0,0,0,0.1)] cursor-pointer flex flex-col justify-between h-[130px] relative"
              >
                <div className="flex justify-between items-start">
                  <div className="text-[12px] font-semibold text-white/50 tracking-wide uppercase">Up Next</div>
                  <TrendingUp size={16} className="text-[#D4FF00]" />
                </div>
                <div>
                  <div className="text-[14px] font-medium text-white leading-relaxed mb-2 pr-10">
                    {remainingProtein <= 0 ? "Goal met!" : (remainingProtein > 30 ? "Chicken Breast" : "Greek Yogurt")}
                  </div>
                  {remainingProtein > 0 && (
                     <div className="inline-block bg-[rgba(212,255,0,0.1)] text-[#D4FF00] text-[10px] font-bold px-2 py-0.5 rounded">
                       ~{remainingProtein > 30 ? '350' : '200'} kcal
                     </div>
                  )}
                </div>
                <div className="absolute bottom-4 right-4 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.15)]">
                  <Plus size={20} strokeWidth={2.5} color="#000" />
                </div>
              </motion.div>
            </div>

            {/* Daily Score */}
            <motion.div 
              whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} 
              className="rounded-[24px] p-5 bg-[#1C1C1E] border border-white/5 shadow-[0_2px_12px_rgba(0,0,0,0.1)] flex items-center justify-between"
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 mb-2">
                   <Star size={14} className="text-[#D4FF00]" />
                   <span className="text-[12px] font-semibold text-white/50 tracking-wide uppercase">Daily Score</span>
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-[40px] tracking-tight font-bold font-bold tracking-tighter text-white leading-none">
                    <AnimatedNumber value={completionScore} duration={1000} />
                  </span>
                  <span className="text-[16px] font-medium text-white/40">/ 100</span>
                </div>
                <div className="text-[13px] text-white/60">
                  {completionScore > 80 ? "Great job! Keep going." : "Almost there, stay focused."}
                </div>
              </div>
              
              <div className="relative flex items-center justify-center w-[60px] h-[60px] shrink-0">
                  <svg width="60" height="60" viewBox="0 0 60 60" className="transform -rotate-90">
                    <circle cx="30" cy="30" r="26" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                    <circle cx="30" cy="30" r="26" fill="transparent" stroke="#D4FF00" strokeWidth="6" strokeLinecap="round"
                      strokeDasharray={scoreCircumference}
                      style={{ strokeDashoffset: mounted ? scoreOffset : scoreCircumference, transition: "stroke-dashoffset 1s cubic-bezier(0.34,1.56,0.64,1) 0.2s" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Star size={16} className="text-white/80" fill={completionScore >= 100 ? "#D4FF00" : "transparent"} />
                  </div>
              </div>
            </motion.div>
          </>
        )}

      </div>
      
      </Profiler>
  );
}