import re

code = """
import React, { Profiler, useEffect, useState, useRef, memo } from 'react';
import { onRenderCallback, useRenderTracker } from '@/shared/utils/perfDebug';
import { useAppStore } from "@/app/store";
import { reportService } from "@/features/reports/services/reportService";
import { calculateCurrentDailyStreak, isDailyGoalMet, toUtcDay } from "@/shared/utils/streaks";
import { Target, Footprints, Flame, Sparkles, ChevronRight, Activity, TrendingDown, TrendingUp, Plus } from "lucide-react";
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

  const getRemainingText = (eaten: number, target: number, unit: string = '') => {
    if (!target) return 'No target set';
    const diff = target - eaten;
    if (diff > 0) return `${Math.round(diff)}${unit} left`;
    if (diff < 0) return `${Math.round(Math.abs(diff))}${unit} over`;
    return 'Goal met';
  };

  const getAiInsight = () => {
    if (completionScore >= 100) return "Incredible work today. You've hit your nutritional targets perfectly. Keep resting and hydrating.";
    if (eatenKcal === 0) return "Good morning! Start your day strong with a protein-rich breakfast to set the tone.";
    if (proPct < calPct) return "You're consuming calories faster than protein. Prioritize a high-protein source in your next meal.";
    if (remainingKcal < 300 && remainingProtein > 30) return "Calories are running low but protein is still needed. Opt for lean sources like egg whites or a shake.";
    return "You're on track. Keep your hydration up and maintain your current pace for the rest of the day.";
  };

  const ringCircumference = 2 * Math.PI * 40;
  const ringOffset = ringCircumference - calPct * ringCircumference;

  return (
    <Profiler id="DashboardPage" onRender={onRenderCallback}>
      <div className="page-enter px-4 pb-[calc(80px+env(safe-area-inset-bottom))] pt-6 space-y-5">
        
        {/* Header */}
        <div className="flex justify-between items-end mb-2">
          <div>
            <div className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1">{dateString}</div>
            <h2 className="text-[28px] font-bold tracking-tight text-white leading-none">
              Ready, {name}?
            </h2>
          </div>
          <motion.div 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer"
          >
            <span className="text-[14px] font-medium text-white">{name.charAt(0).toUpperCase()}</span>
          </motion.div>
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
            {/* AI Insight Card (Apple Intelligence inspired) */}
            <motion.div 
              whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
              className="relative overflow-hidden rounded-[24px] p-5 bg-gradient-to-br from-[#1C1C1E] to-[#121212] border border-white/10 shadow-lg cursor-pointer group"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                <Sparkles size={64} />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-[#D4FF00]" />
                <span className="text-[12px] font-bold text-[#D4FF00] tracking-widest uppercase">Today's Mission</span>
              </div>
              <p className="text-[15px] text-white/90 leading-relaxed font-medium pr-4">
                {getAiInsight()}
              </p>
            </motion.div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Daily Score */}
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="rounded-[24px] p-5 bg-[#1C1C1E] border border-white/5 shadow-sm flex flex-col justify-between h-[110px]">
                <div className="text-[12px] font-semibold text-white/50 tracking-wide uppercase">Daily Score</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[36px] font-bold tracking-tighter text-white leading-none">
                    <AnimatedNumber value={completionScore} duration={1000} />
                  </span>
                  <span className="text-[16px] font-medium text-white/40">%</span>
                </div>
              </motion.div>
              
              {/* Streak */}
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="rounded-[24px] p-5 bg-[#1C1C1E] border border-white/5 shadow-sm flex flex-col justify-between h-[110px]">
                <div className="text-[12px] font-semibold text-white/50 tracking-wide uppercase">Active Streak</div>
                <div className="flex items-center gap-2">
                  <Flame size={28} className={currentStreak > 0 ? "text-[#FF4D1C]" : "text-white/20"} strokeWidth={2.5} />
                  <span className="text-[36px] font-bold tracking-tighter text-white leading-none">
                    <AnimatedNumber value={currentStreak} duration={1000} />
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Nutrition Center */}
            <motion.div 
              whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/calorie')}
              className="rounded-[24px] p-5 bg-[#1C1C1E] border border-white/5 shadow-sm cursor-pointer"
            >
              <div className="flex justify-between items-center mb-5">
                <div className="text-[16px] font-semibold text-white flex items-center gap-2">
                  <Target size={18} className="text-[#D4FF00]" /> Nutrition
                </div>
                <ChevronRight size={18} className="text-white/30" />
              </div>
              
              <div className="flex items-center gap-6">
                {/* Compact Ring */}
                <div className="relative flex items-center justify-center w-[90px] h-[90px] shrink-0">
                  <svg width="90" height="90" viewBox="0 0 90 90" className="transform -rotate-90">
                    <circle cx="45" cy="45" r="40" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                    <circle cx="45" cy="45" r="40" fill="transparent" stroke="#D4FF00" strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={ringCircumference}
                      style={{ strokeDashoffset: mounted ? ringOffset : ringCircumference, transition: "stroke-dashoffset 1s cubic-bezier(0.34,1.56,0.64,1) 0.2s" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pt-0.5">
                    <div className="text-[18px] font-bold tracking-tighter text-white leading-none">
                      {Math.round((calPct) * 100)}%
                    </div>
                  </div>
                </div>

                {/* Macro Bars */}
                <div className="flex-1 flex flex-col gap-3">
                  {/* Protein */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-end text-[11px] leading-none">
                      <span className="font-semibold text-white/70 uppercase tracking-wider">Protein</span>
                      <span className="font-medium text-white/40">{eatenProtein} / {proteinTarget}g</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full bg-[#378ADD] rounded-full" style={{ width: mounted ? `${proPct * 100}%` : '0%', transition: "width 1s cubic-bezier(0.34,1.56,0.64,1) 0.3s" }} />
                    </div>
                  </div>
                  {/* Fat */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-end text-[11px] leading-none">
                      <span className="font-semibold text-white/70 uppercase tracking-wider">Fat</span>
                      <span className="font-medium text-white/40">{eatenFat} / {fatTarget}g</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full bg-[#FF4D1C] rounded-full" style={{ width: mounted ? `${fatPct * 100}%` : '0%', transition: "width 1s cubic-bezier(0.34,1.56,0.64,1) 0.4s" }} />
                    </div>
                  </div>
                  {/* Carbs */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-end text-[11px] leading-none">
                      <span className="font-semibold text-white/70 uppercase tracking-wider">Carbs</span>
                      <span className="font-medium text-white/40">{eatenCarbs} / {carbsTarget}g</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full bg-[#D4FF00] rounded-full" style={{ width: mounted ? `${carbPct * 100}%` : '0%', transition: "width 1s cubic-bezier(0.34,1.56,0.64,1) 0.5s" }} />
                    </div>
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
                className="rounded-[24px] p-5 bg-[#1C1C1E] border border-white/5 shadow-sm cursor-pointer flex flex-col justify-between h-[140px]"
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
                  <div className="text-[11px] font-medium text-white/40 flex items-center gap-1">
                    Target: {targetWeightKg > 0 ? targetWeightKg : '--'} kg
                  </div>
                </div>
              </motion.div>

              {/* Next Meal Suggestion */}
              <motion.div 
                whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/meals')}
                className="rounded-[24px] p-5 bg-[#1C1C1E] border border-white/5 shadow-sm cursor-pointer flex flex-col justify-between h-[140px]"
              >
                <div className="flex justify-between items-start">
                  <div className="text-[12px] font-semibold text-white/50 tracking-wide uppercase">Up Next</div>
                  <Utensils size={16} className="text-[#D4FF00]" />
                </div>
                <div>
                  <div className="text-[14px] font-medium text-white leading-snug mb-2">
                    {remainingProtein <= 0 ? "Goal met!" : (remainingProtein > 30 ? "Chicken Breast" : "Greek Yogurt")}
                  </div>
                  {remainingProtein > 0 && (
                     <div className="inline-block bg-[rgba(212,255,0,0.1)] text-[#D4FF00] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                       ~{remainingProtein > 30 ? '40' : '20'}g PRO
                     </div>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}

      </div>
      
      {/* 7. Log meal FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/meals')}
        className="fab fixed bottom-[calc(80px+env(safe-area-inset-bottom))] right-5 w-[60px] h-[60px] rounded-full bg-white shadow-[0_8px_32px_rgba(255,255,255,0.2)] flex items-center justify-center z-50 transition-colors hover:bg-gray-100"
      >
        <Plus size={28} strokeWidth={2} color="#000" />
      </motion.button>
    </Profiler>
  );
}
"""

with open("src/features/dashboard/pages/DashboardPage.tsx", "w") as f:
    f.write(code.strip())

