import { useNavigate } from "react-router-dom";
import React, { useMemo, useEffect, useState, useRef, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { profileService } from "@/features/profile/services/profileService";
import { mealService } from "../services/mealService";
import { useCalculatedProfile } from "@/shared/hooks/useCalculatedProfile";
import { useUserStore } from "@/features/profile/store/userStore";
import { reportService } from "@/features/reports/services/reportService";
import { DailyHistoryChart } from "../components/DailyHistoryChart";
import { ChevronLeft, Utensils } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/shared/utils/utils";

const AnimatedNumber = memo(function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
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
      observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          startAnimation();
          observer.disconnect();
        }
      }, { threshold: 0.1 });
      observer.observe(elementRef.current);
    }
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (observer) observer.disconnect();
    };
  }, [value, duration]);
  return <span ref={elementRef}>{displayValue}</span>;
});

function getLocalDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function CalorieDetailPage() {
  const navigate = useNavigate();
  const { profileData: onboardingData } = useCalculatedProfile();
  const { data: metrics = [] } = useQuery({ queryKey: ["dailyMetrics"], queryFn: () => reportService.getDailyMetrics() });
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => profileService.getProfile() });
  const { data: goal } = useQuery({ queryKey: ["goal"], queryFn: () => profileService.getGoal() });
  const { data: meals = [] } = useQuery({ queryKey: ["meals", "month"], queryFn: () => mealService.getMeals({ days: 35, limit: 2000 }) });

  const dailyCalorieGoal =
    profile?.maintenance_kcal && goal?.deficit_kcal !== undefined
      ? profile.maintenance_kcal - goal.deficit_kcal
      : (onboardingData?.dailyCalorieGoal ?? 2000);

  const todayStr = getLocalDateString();
  const todayMeals = meals.filter(m => {
    const d = new Date(m.meal_time);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return dateStr === todayStr;
  });
  const caloriesConsumed = todayMeals.reduce((acc, m) => acc + m.calories, 0);
  const isUnderTarget = caloriesConsumed <= dailyCalorieGoal;
  
  const chartLogs = useMemo(() => {
    const logs = [...metrics];
    
    // Group all meals by date
    const mealsByDate = meals.reduce((acc: any, m: any) => {
      const d = new Date(m.meal_time);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!acc[dateStr]) acc[dateStr] = 0;
      acc[dateStr] += m.calories;
      return acc;
    }, {});

    // Overwrite actuals with dynamically aggregated meals
    logs.forEach(l => {
      if (mealsByDate[l.date] !== undefined) {
        l.actual_calories = mealsByDate[l.date];
      } else {
        l.actual_calories = 0;
      }
    });

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
    return logs;
  }, [metrics, meals, todayStr, caloriesConsumed, dailyCalorieGoal]);

  const chartData = useMemo(() => {
    return chartLogs.map(l => ({
      date: l.date,
      actual: l.actual_calories,
      target: l.target_calories
    }));
  }, [chartLogs]);

  const slots = [
    { id: 'breakfast', label: 'Breakfast', items: todayMeals.filter(m => m.meal_slot === 'breakfast') },
    { id: 'lunch', label: 'Lunch', items: todayMeals.filter(m => m.meal_slot === 'lunch') },
    { id: 'dinner', label: 'Dinner', items: todayMeals.filter(m => m.meal_slot === 'dinner') },
    { id: 'other', label: 'Snacks / Other', items: todayMeals.filter(m => !['breakfast', 'lunch', 'dinner'].includes(m.meal_slot || '')) },
  ];

  const calPct = dailyCalorieGoal ? Math.min(caloriesConsumed / dailyCalorieGoal, 1.1) : 0;
  const progressColor = caloriesConsumed > dailyCalorieGoal * 1.05 ? '#FF3B30' : (caloriesConsumed >= dailyCalorieGoal * 0.9 ? '#FBBF24' : '#D4FF00');

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="page-enter pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(100px+env(safe-area-inset-bottom))] min-h-[100dvh] bg-[#0A0A0A] px-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <button onClick={() => navigate("/dashboard")} className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.03)] flex items-center justify-center transition-colors hover:bg-[rgba(255,255,255,0.1)]">
          <ChevronLeft size={20} className="text-white" />
        </button>
        <h1 className="text-[17px] font-semibold text-white tracking-tight">Calories</h1>
        <div className="w-8" />
      </div>

      {/* Hero Number Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center text-center mb-10 mt-4">
        <div className="flex items-baseline gap-1.5 mb-2">
          <span className="text-[52px] font-bold text-white tracking-tighter leading-none"><AnimatedNumber value={caloriesConsumed} /></span>
        </div>
        <div className="text-[14px] text-[rgba(255,255,255,0.45)] mb-6">of {dailyCalorieGoal} kcal</div>
        
        {/* Progress bar */}
        <div className="w-full max-w-[280px] progress-track h-2 rounded-full overflow-hidden bg-[rgba(255,255,255,0.1)]">
          <div 
            className="h-full rounded-full transition-all duration-1000 ease-out" 
            style={{ width: mounted ? `${Math.min(100, calPct * 100)}%` : '0%', backgroundColor: progressColor }} 
          />
        </div>
      </motion.div>

      {/* 7-Day History Chart */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-base p-4 mb-10">
        <div className="text-[16px] font-medium text-white mb-6">Daily calorie history</div>
        <DailyHistoryChart logs={chartData} todayStr={todayStr} unit="kcal" type="calorie" />
      </motion.div>

      {/* Meal Breakdown Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="stagger-children">
        <div className="text-[18px] font-semibold text-white mb-4">Today's Meals</div>
        
        {meals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Utensils size={32} className="text-[rgba(255,255,255,0.15)] mb-4" />
            <div className="text-[13px] text-[rgba(255,255,255,0.35)] mb-4 text-center">No meals logged yet</div>
            <button onClick={() => navigate('/meals')} className="btn-ghost text-[14px] text-[#D4FF00] border-[rgba(212,255,0,0.3)] hover:bg-[rgba(212,255,0,0.1)]">
              Log your first meal →
            </button>
          </div>
        ) : (
          <div>
            {slots.filter(s => s.items.length > 0).map(slot => {
              const slotKcal = slot.items.reduce((a, b) => a + b.calories, 0);
              return (
                <div key={slot.id} className="card-base mb-3 overflow-hidden">
                  <div className="flex items-center justify-between p-4 bg-[rgba(255,255,255,0.02)] border-b border-[rgba(255,255,255,0.06)]">
                    <span className="text-[16px] font-medium text-white">{slot.label}</span>
                    <span className="text-[14px] font-bold text-white">{slotKcal} kcal</span>
                  </div>
                  <div className="px-4">
                    {slot.items.map((item, i) => (
                      <div key={item.id || i} className={cn("flex items-center justify-between py-3", i < slot.items.length - 1 && "border-b border-[rgba(255,255,255,0.06)]")}>
                        <span className="text-[15px] text-white leading-relaxed capitalize pr-4">{item.meal_text}</span>
                        <span className="text-[14px] font-medium text-[rgba(255,255,255,0.6)] shrink-0">{item.calories} kcal</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
