import React, { Profiler } from 'react';
import { onRenderCallback, useRenderTracker, useHeavyEffectTracker } from '@/shared/utils/perfDebug';
import { useUserStore } from "@/features/profile/store/userStore";
import { useAppStore } from "@/app/store";
import { reportService } from "@/features/reports/services/reportService";
import { calculateCurrentDailyStreak, isDailyGoalMet, toUtcDay } from "@/shared/utils/streaks";
import { Target, Footprints, Utensils, CheckCircle2, X, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCalculatedProfile } from "@/shared/hooks/useCalculatedProfile";
import { profileService } from "@/features/profile/services/profileService";
import { mealService } from "@/features/nutrition/services/mealService";
import { complianceService } from "@/features/reports/services/complianceService";
import { useEffect, useState, useRef, memo } from "react";
import { QueryError } from "@/shared/components/QueryError";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { hover, tap } from "@/features/reports/components/motion";

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
  const dismissedBanners = useAppStore(s => s.dismissedBanners);
  const dismissBanner = useAppStore(s => s.dismissBanner);
  const { data: metrics = [] } = useQuery({ queryKey: ["dailyMetrics"], queryFn: () => reportService.getDailyMetrics() });
  const currentStreak = calculateCurrentDailyStreak(metrics);
  const todayMetric = metrics.find(m => toUtcDay(m.date) === toUtcDay(new Date()));
  const todayMet = todayMetric ? isDailyGoalMet(todayMetric) : false;
  const { profileData: onboardingData, profile, goal } = useCalculatedProfile();

  const navigate = useNavigate();
  const bannerDismissed = dismissedBanners.includes('premium_beta');
  const setBannerDismissed = (dismissed: boolean) => dismissed && dismissBanner('premium_beta');
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

  const name = profile?.name ?? onboardingData?.name ?? "User";
  const targetBf = goal?.target_bf ?? onboardingData?.targetBodyFatPct;
  const currentBf = goal?.current_bf ?? onboardingData?.currentBodyFatPct;
  const proteinTarget = profile?.protein_target ?? onboardingData?.proteinMid;
  
  if (import.meta.env.DEV) console.time('[PERF] Dashboard Calculations');
  const dailyTargetKcal =
    profile?.maintenance_kcal && goal?.deficit_kcal !== undefined
      ? profile.maintenance_kcal - goal.deficit_kcal
      : onboardingData?.dailyCalorieGoal;

  const todaysMeals = meals || [];
  const eatenKcal = todaysMeals.reduce((acc, m) => acc + m.calories, 0);
  const eatenProtein = todaysMeals.reduce((acc, m) => acc + m.protein, 0);
  const eatenFat = todaysMeals.reduce((acc, m) => acc + m.fat, 0);
  const eatenCarbs = todaysMeals.reduce((acc, m) => acc + m.carbs, 0);

  const remainingKcal = dailyTargetKcal !== undefined ? Math.max(0, dailyTargetKcal - eatenKcal) : undefined;
  const remainingProtein = proteinTarget !== undefined ? Math.max(0, proteinTarget - eatenProtein) : undefined;

  const dateString = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  const progressPercent =
    currentBf !== undefined && targetBf !== undefined
      ? Math.min(100, Math.max(5, 100 - (currentBf - targetBf) * 5))
      : 0;

  const fatTarget = 60; // fallback target
  const carbsTarget = 200; // fallback target

  const calPct = dailyTargetKcal ? Math.min(eatenKcal / dailyTargetKcal, 1) : 0;
  const proPct = proteinTarget ? Math.min(eatenProtein / proteinTarget, 1) : 0;
  const fatPct = fatTarget ? Math.min(eatenFat / fatTarget, 1) : 0;
  const carbPct = carbsTarget ? Math.min(eatenCarbs / carbsTarget, 1) : 0;

  const circumference = 2 * Math.PI * 60;
  const strokeDashoffset = circumference - calPct * circumference;

  return (
    <Profiler id="DashboardPage" onRender={onRenderCallback}>
      <div className="page-enter px-4 pb-[calc(80px+env(safe-area-inset-bottom))] pt-4">
      {/* 2. Greeting section */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-[22px] font-semibold tracking-[-0.4px] text-white">
            Hi, {name}
          </h2>
          <div className="text-[13px] text-[rgba(255,255,255,0.45)]">
            {dateString}
          </div>
        </div>
        {currentStreak > 0 && (
          <div className="badge-lime flex items-center gap-1 px-2.5 py-1">
            <span className="text-[14px]">🔥</span>
            <span className="font-bold text-[13px]">{currentStreak}</span>
          </div>
        )}
      </div>

      {isMealsError ? (
        <div className="card-base border border-red-500/30 bg-red-500/5 p-6 mb-6 flex flex-col items-center justify-center text-center">
          <div className="text-red-400 font-medium mb-3">Failed to load meals</div>
          <button onClick={() => refetchMeals()} className="btn-ghost text-red-400 border border-red-500/30">
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* 3. Main calorie ring card */}
          <motion.div 
            whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/calorie')}
            className="card-base mb-4 relative flex items-center justify-center py-8 cursor-pointer"
          >
            <svg width="140" height="140" viewBox="0 0 140 140" className="transform -rotate-90">
              <circle cx="70" cy="70" r="60" fill="transparent" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
              <circle cx="70" cy="70" r="60" fill="transparent" stroke="#D4FF00" strokeWidth="12" strokeLinecap="round"
                strokeDasharray={circumference}
                style={{ strokeDashoffset: mounted ? strokeDashoffset : circumference, transition: "stroke-dashoffset 1s cubic-bezier(0.34,1.56,0.64,1) 0.2s" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-[32px] font-bold tracking-tight text-white leading-none mb-1">
                <AnimatedNumber value={eatenKcal} duration={1000} />
              </div>
              <div className="text-[13px] text-[rgba(255,255,255,0.4)]">
                / {dailyTargetKcal || 0} kcal
              </div>
            </div>
          </motion.div>

          {/* 4. Macro row */}
          <div className="flex gap-3 mb-6 stagger-children">
            {/* Protein */}
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/protein')} className="card-base flex-1 flex flex-col items-center py-4 cursor-pointer">
              <div className="text-[18px] font-semibold text-[#378ADD] leading-none mb-1">
                <AnimatedNumber value={eatenProtein} duration={800} />g
              </div>
              <div className="text-[10px] uppercase tracking-wider text-[rgba(255,255,255,0.38)] mb-3">
                Protein
              </div>
              <div className="progress-track w-12 h-1.5 rounded-full overflow-hidden bg-[rgba(255,255,255,0.1)]">
                <div className="h-full bg-[#378ADD] rounded-full" style={{ width: mounted ? `${proPct * 100}%` : '0%', transition: "width 1s cubic-bezier(0.34,1.56,0.64,1) 0.3s" }} />
              </div>
            </motion.div>

            {/* Fat */}
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="card-base flex-1 flex flex-col items-center py-4 cursor-pointer">
              <div className="text-[18px] font-semibold text-[#FF4D1C] leading-none mb-1">
                <AnimatedNumber value={eatenFat} duration={800} />g
              </div>
              <div className="text-[10px] uppercase tracking-wider text-[rgba(255,255,255,0.38)] mb-3">
                Fat
              </div>
              <div className="progress-track w-12 h-1.5 rounded-full overflow-hidden bg-[rgba(255,255,255,0.1)]">
                <div className="h-full bg-[#FF4D1C] rounded-full" style={{ width: mounted ? `${fatPct * 100}%` : '0%', transition: "width 1s cubic-bezier(0.34,1.56,0.64,1) 0.4s" }} />
              </div>
            </motion.div>

            {/* Carbs */}
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="card-base flex-1 flex flex-col items-center py-4 cursor-pointer">
              <div className="text-[18px] font-semibold text-[#D4FF00] leading-none mb-1">
                <AnimatedNumber value={eatenCarbs} duration={800} />g
              </div>
              <div className="text-[10px] uppercase tracking-wider text-[rgba(255,255,255,0.38)] mb-3">
                Carbs
              </div>
              <div className="progress-track w-12 h-1.5 rounded-full overflow-hidden bg-[rgba(255,255,255,0.1)]">
                <div className="h-full bg-[#D4FF00] rounded-full" style={{ width: mounted ? `${carbPct * 100}%` : '0%', transition: "width 1s cubic-bezier(0.34,1.56,0.64,1) 0.5s" }} />
              </div>
            </motion.div>
          </div>

          {/* 5. What to eat next */}
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="card-base p-4 mb-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[rgba(255,255,255,0.38)] mb-3">
              Suggested for tonight
            </div>
            {remainingProtein !== undefined && remainingProtein <= 0 ? (
              <div className="text-[14px] font-medium text-[#D4FF00] flex items-center gap-2 py-2">
                <CheckCircle2 size={16} /> Protein target hit! Great work today.
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="flex items-start gap-3 py-3 border-b border-[rgba(255,255,255,0.06)]">
                  <div className="flex flex-col flex-1">
                    <div className="text-[14px] font-medium text-white mb-2">
                      {remainingProtein !== undefined && remainingProtein > 30 ? "4 whole eggs + 1 cup milk" : "2 boiled eggs + Greek yogurt"}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="badge-lime text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {remainingProtein !== undefined && remainingProtein > 30 ? "~28g PRO" : "~20g PRO"}
                      </span>
                      <span className="bg-[rgba(255,77,28,0.12)] text-[#FF4D1C] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                        {remainingProtein !== undefined && remainingProtein > 30 ? "~350 KCAL" : "~200 KCAL"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 py-3">
                  <div className="flex flex-col flex-1">
                    <div className="text-[14px] font-medium text-white mb-2">
                      {remainingProtein !== undefined && remainingProtein > 40 ? "250g grilled chicken breast" : "150g grilled chicken breast"}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="badge-lime text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {remainingProtein !== undefined && remainingProtein > 40 ? "~55g PRO" : "~33g PRO"}
                      </span>
                      <span className="bg-[rgba(255,77,28,0.12)] text-[#FF4D1C] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                        {remainingProtein !== undefined && remainingProtein > 40 ? "~280 KCAL" : "~165 KCAL"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* 6. Steps reminder card */}
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="card-base p-4 flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Footprints size={20} className="text-[#FF4D1C]" />
              <span className="text-[16px] font-semibold text-white">12,000 steps</span>
            </div>
            <div className="bg-[rgba(251,191,36,0.12)] text-[#FBBF24] text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
              Reminder only
            </div>
          </motion.div>
        </>
      )}

      {/* 7. Log meal FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/meals')}
        className="fab fixed bottom-[calc(68px+env(safe-area-inset-bottom))] right-5 w-[56px] h-[56px] rounded-full bg-[#D4FF00] shadow-[0_8px_32px_rgba(212,255,0,0.3)] flex items-center justify-center z-50"
      >
        <Plus size={24} strokeWidth={2.5} color="#000" />
      </motion.button>
    </div>
    </Profiler>
  );
}
