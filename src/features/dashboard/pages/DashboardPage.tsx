import { useUserStore } from "@/features/profile";
import { useAppStore } from "@/app/store";
import { useStreaks } from "@/shared/hooks/useStreaks";
import { Target, Footprints, Utensils, CheckCircle2, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileService } from "@/features/profile";
import { mealService } from "@/features/nutrition";
import { weightService } from "@/features/progress";
import { complianceService } from "@/features/reports";
import { useEffect, useState, useRef } from "react";
import { QueryError } from "@/shared/components/QueryError";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";

function AnimatedNumber({
  value,
  duration = 800,
}: {
  value: number;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let start: number | null = null;
    let animationFrameId: number;

    const update = (time: number) => {
      if (!start) start = time;
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4); // easeOutExpo
      setDisplayValue(Math.round(ease * value));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(update);
      }
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value, duration]);

  return <span ref={elementRef}>{displayValue}</span>;
}

export function DashboardPage() {
  const onboardingData = useUserStore(s => s.onboardingData);
  const dismissedBanners = useAppStore(s => s.dismissedBanners);
  const dismissBanner = useAppStore(s => s.dismissBanner);
  const { calorieStreak, proteinStreak } = useStreaks();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const bannerDismissed = dismissedBanners.includes('premium_beta');
  const setBannerDismissed = (dismissed: boolean) => dismissed && dismissBanner('premium_beta');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    data: profile,
    isError: isProfileError,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileService.getProfile(),
  });
  const {
    data: goal,
    isError: isGoalError,
    error: goalError,
    refetch: refetchGoal,
  } = useQuery({ queryKey: ["goal"], queryFn: () => profileService.getGoal() });
  const {
    data: meals,
    isError: isMealsError,
    refetch: refetchMeals,
  } = useQuery({
    queryKey: ["meals", "today"],
    queryFn: () => mealService.getTodaysMeals(),
  });

  const { data: scores } = useQuery({
    queryKey: ["complianceScore"],
    queryFn: () => complianceService.getScores(),
  });

  if (isProfileError || isGoalError) {
    return (
      <div className="flex flex-col h-full justify-center">
        <QueryError
          error={profileError || goalError}
          onRetry={() => {
            if (isProfileError) refetchProfile();
            if (isGoalError) refetchGoal();
          }}
        />
      </div>
    );
  }

  const name = profile?.name ?? onboardingData?.name ?? "User";
  const targetBf = goal?.target_bf ?? onboardingData?.targetBodyFatPct;
  const currentBf = goal?.current_bf ?? onboardingData?.currentBodyFatPct;
  const proteinTarget = profile?.protein_target ?? onboardingData?.proteinMid;
  const strategyName = goal?.strategy ?? onboardingData?.chosenStrategyName ?? "Recommended";

  const dailyTargetKcal =
    profile?.maintenance_kcal && goal?.deficit_kcal !== undefined
      ? profile.maintenance_kcal - goal.deficit_kcal
      : onboardingData?.dailyCalorieGoal;

  // Calculate today's intake directly from DB meals
  const todaysMeals = meals || [];
  const eatenKcal = todaysMeals.reduce((acc, m) => acc + m.calories, 0);
  const eatenProtein = todaysMeals.reduce((acc, m) => acc + m.protein, 0);

  const remainingKcal = dailyTargetKcal !== undefined ? Math.max(0, dailyTargetKcal - eatenKcal) : undefined;
  const remainingProtein = proteinTarget !== undefined ? Math.max(0, proteinTarget - eatenProtein) : undefined;

  let projectedDateString = "Unknown";
  if (goal?.deficit_kcal === 0 || onboardingData?.dailyDeficit === 0) {
    projectedDateString = "Ongoing";
  } else if (goal?.target_date) {
    const targetDateObj = new Date(goal.target_date);
    if (!isNaN(targetDateObj.getTime())) {
      projectedDateString = targetDateObj.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    }
  } else if (onboardingData?.estimatedCompletionDate) {
    projectedDateString = onboardingData.estimatedCompletionDate;
  }

  // Calculate Days
  let currentDay = 0;
  let totalDays = 0;
  let isMaintenance =
    goal?.deficit_kcal === 0 || onboardingData?.dailyDeficit === 0;

  if (goal?.created_at) {
    const start = new Date(goal.created_at);
    start.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    currentDay = Math.max(
      0,
      Math.round((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
    );

    if (goal?.target_date && !isMaintenance) {
      const end = new Date(goal.target_date);
      end.setHours(0, 0, 0, 0);
      totalDays = Math.max(
        1,
        Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
      );
      if (currentDay > totalDays) currentDay = totalDays;
    }
  } else if (onboardingData?.estimatedWeeks && !isMaintenance) {
    totalDays = onboardingData.estimatedWeeks * 7;
    currentDay = 0; // Just started
  }

  const dateString = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
  const todayScore = scores?.todayScore ?? 0;

  const progressPercent =
    currentBf !== undefined && targetBf !== undefined
      ? Math.min(100, Math.max(5, 100 - (currentBf - targetBf) * 5))
      : 0;

  return (
    <div className="screen-container screen-enter">
      {!bannerDismissed && (
        <div className="bg-[rgba(212,255,0,0.1)] border-[0.5px] border-[#D4FF00]/30 text-[#D4FF00] p-[12px_16px] text-[13px] font-medium mb-[20px] rounded-xl flex justify-between items-center">
          <span>LeanIQA Beta — Premium unlocked.</span>
          <button
            onClick={() => setBannerDismissed(true)}
            className="text-[#D4FF00] hover:opacity-70 transition-opacity"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {!goal && (
        <div className="glass-card text-white p-[16px_20px] text-center mb-[20px] flex flex-col items-center gap-[12px]">
          <div className="text-[15px] font-medium text-[#EBEBF5CC]">
            Set your body goal to unlock all features
          </div>
          <button
            onClick={() => navigate("/goal")}
            className="bg-[#D4FF00] text-[#0A0A0A] font-bold text-[15px] rounded-[100px] p-[12px_24px] border-none tracking-[-0.2px] hover:scale-[1.02] active:scale-[0.97] transition-all"
          >
            Set goal →
          </button>
        </div>
      )}

      {/* SECTION 2 — Hero greeting row */}
      <div className="flex justify-between items-center mb-[24px]">
        <div>
          <h2 className="text-[22px] font-semibold text-white tracking-[-0.3px] mb-1">
            Hi, {name}
          </h2>
          <div className="text-[13px] font-medium uppercase tracking-[0.06em] text-[#EBEBF599]">
            {dateString}
          </div>
        </div>
        <div className="flex flex-col items-center">
          <motion.div
            key={todayScore}
            initial={{ scale: 1.3, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="w-[44px] h-[44px] rounded-[100px] border-[1.5px] border-[#D4FF00] flex items-center justify-center text-[#D4FF00] text-[17px] font-bold shadow-[0_0_15px_rgba(212,255,0,0.2)] bg-[rgba(212,255,0,0.05)]"
          >
            {todayScore}
          </motion.div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#EBEBF599] mt-[8px]">
            Score
          </div>
        </div>
      </div>

      {/* Streak chips */}
      <div className="streak-row mb-[16px]">
        <div className={`streak-chip ${calorieStreak >= 7 ? 'hot' : ''}`}>
          <span style={{ fontSize: '18px' }}>🔥</span>
          <div>
            <div style={{ fontSize: 'var(--font-xl)', fontWeight: 700, color: calorieStreak > 0 ? '#D4FF00' : 'rgba(235,235,245,0.4)', lineHeight: 1 }}>
              {calorieStreak > 0 ? calorieStreak : '—'}
            </div>
            <div style={{ fontSize: 'var(--font-xs)', color: 'rgba(235,235,245,0.5)', textTransform: 'uppercase', fontWeight: 600 }}>
              cal streak
            </div>
          </div>
        </div>
        <div className={`streak-chip ${proteinStreak >= 7 ? 'hot-protein' : ''}`}>
          <span style={{ fontSize: '18px' }}>💪</span>
          <div>
            <div style={{ fontSize: 'var(--font-xl)', fontWeight: 700, color: proteinStreak > 0 ? '#FF4D1C' : 'rgba(235,235,245,0.4)', lineHeight: 1 }}>
              {proteinStreak > 0 ? proteinStreak : '—'}
            </div>
            <div style={{ fontSize: 'var(--font-xs)', color: 'rgba(235,235,245,0.5)', textTransform: 'uppercase', fontWeight: 600 }}>
              protein streak
            </div>
          </div>
        </div>
      </div>



      {/* SECTION 3 — Body fat hero card */}
      <div
        className="progress-section-tappable"
        onClick={() => navigate("/transformation")}
      >
        <div className="progress-view-hint">
          <i
            className="ti ti-chart-line"
            style={{ fontSize: "13px" }}
            aria-hidden="true"
          ></i>{" "}
          View transformation
        </div>
        <div className="absolute -right-6 -top-6 w-[100px] h-[100px] bg-[#D4FF00]/10 rounded-full blur-[40px] pointer-events-none"></div>

        <div className="flex justify-between items-center mb-[16px] relative z-10">
          <span className="text-[13px] font-semibold uppercase tracking-[0.05em] text-[#EBEBF599] flex items-center gap-[6px]">
            <Target size={14} /> {targetBf !== undefined ? targetBf : "—"}%
            Target
          </span>
          <span className="bg-[rgba(212,255,0,0.1)] text-[#D4FF00] px-[10px] py-[4px] text-[11px] font-bold rounded-[100px] uppercase tracking-[0.04em]">
            {projectedDateString}
          </span>
        </div>
        <div className="flex items-baseline gap-[12px] mb-[16px] relative z-10">
          <span className="text-[40px] font-bold tracking-[-1px] text-white leading-none">
            {currentBf !== undefined ? currentBf.toFixed(1) : "—"}%
          </span>
          <span className="text-[15px] font-medium text-[#EBEBF5CC]">
            Current Body Fat
          </span>
        </div>

        {/* Animated Progress Bar */}
        <div className="h-[4px] bg-[rgba(255,255,255,0.1)] rounded-[100px] overflow-hidden mt-[20px] relative z-10">
          <div
            className="h-full rounded-[100px] bg-gradient-to-r from-[#D4FF00] to-[#A8CC00]"
            style={{
              width: mounted ? `${progressPercent}%` : "0%",
              transition: "width 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.3s",
            }}
          ></div>
        </div>
        <div className="text-[13px] font-normal text-[#EBEBF599] mt-[12px] text-center relative z-10">
          {isMaintenance
            ? "Maintenance Progress"
            : `Day ${currentDay} of ${totalDays} · ${totalDays > 0 ? Math.round((currentDay / totalDays) * 100) : 0}% complete`}
        </div>

        <div className="progress-arrow">
          <i
            className="ti ti-chevron-right"
            style={{ fontSize: "14px", color: "#D4FF00" }}
            aria-hidden="true"
          ></i>
        </div>
      </div>

      {/* Card 2: Today's Targets */}
      <div className="mb-[24px]">
        <div className="flex items-center justify-between mb-[12px]">
          <div className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#EBEBF599]">
            Today's Targets{" "}
            <span className="text-[#D4FF00] ml-[4px]">({strategyName})</span>
          </div>
        </div>

        {/* 2-column grid */}
        <div className="macro-grid-2col mb-[12px]">
          {/* Calories */}
          <div 
            className="progress-section-tappable text-center flex flex-col justify-center relative !mb-0 !p-[14px] !pt-[26px] min-h-[120px] max-w-full overflow-hidden" 
            onClick={() => navigate('/calorie')}
          >
            <div className="absolute top-[8px] right-[8px] text-[10px] font-medium text-[#D4FF00]/70 flex items-center gap-[2px]">
              View history <i className="ti ti-arrow-right" style={{ fontSize: '10px' }} aria-hidden="true"></i>
            </div>
            {isMealsError ? (
              <div
                className="text-[13px] text-[#FF4D1C] my-auto cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  refetchMeals();
                }}
              >
                Retry
              </div>
            ) : (
              <>
                <div className="text-[24px] font-bold tracking-[-0.5px] text-[#FF4D1C] leading-none mb-[4px]">
                  <AnimatedNumber value={eatenKcal} duration={1000} />
                </div>
                <div className="text-[13px] font-normal text-[#EBEBF599]">
                  / {dailyTargetKcal !== undefined ? dailyTargetKcal : "—"} kcal
                </div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#EBEBF5CC] mt-[12px]">
                  Calories
                </div>
                
                <div className="progress-arrow" style={{ bottom: '8px', right: '8px', width: '22px', height: '22px' }}>
                  <i className="ti ti-chevron-right" style={{ fontSize: '12px', color: '#D4FF00' }} aria-hidden="true"></i>
                </div>

                <div className="absolute bottom-0 left-0 h-[4px] bg-[#FF4D1C]/20 w-full">
                  <div
                    className="h-full bg-[#FF4D1C]"
                    style={{
                      width:
                        mounted && dailyTargetKcal
                          ? `${Math.min(100, (eatenKcal / dailyTargetKcal) * 100)}%`
                          : "0%",
                      transition:
                        "width 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.4s",
                    }}
                  ></div>
                </div>
              </>
            )}
          </div>

          {/* Protein */}
          <div 
            className="progress-section-tappable text-center flex flex-col justify-center relative !mb-0 !p-[14px] !pt-[26px] min-h-[120px] max-w-full overflow-hidden" 
            onClick={() => navigate('/protein')}
          >
            <div className="absolute top-[8px] right-[8px] text-[10px] font-medium text-[#D4FF00]/70 flex items-center gap-[2px]">
              View history <i className="ti ti-arrow-right" style={{ fontSize: '10px' }} aria-hidden="true"></i>
            </div>
            {isMealsError ? (
              <div
                className="text-[13px] text-[#FF4D1C] my-auto cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  refetchMeals();
                }}
              >
                Retry
              </div>
            ) : (
              <>
                <div className="text-[24px] font-bold tracking-[-0.5px] text-[#378ADD] leading-none mb-[4px]">
                  <AnimatedNumber value={eatenProtein} duration={1000} />g
                </div>
                <div className="text-[13px] font-normal text-[#EBEBF599]">
                  / {proteinTarget !== undefined ? proteinTarget : "—"}g
                </div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#EBEBF5CC] mt-[12px]">
                  Protein
                </div>

                <div className="progress-arrow" style={{ bottom: '8px', right: '8px', width: '22px', height: '22px' }}>
                  <i className="ti ti-chevron-right" style={{ fontSize: '12px', color: '#D4FF00' }} aria-hidden="true"></i>
                </div>

                <div className="absolute bottom-0 left-0 h-[4px] bg-[#378ADD]/20 w-full">
                  <div
                    className="h-full bg-[#378ADD]"
                    style={{
                      width:
                        mounted && proteinTarget
                          ? `${Math.min(100, (eatenProtein / proteinTarget) * 100)}%`
                          : "0%",
                      transition:
                        "width 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.5s",
                    }}
                  ></div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Steps Reminder */}
        <div className="glass-card p-[16px] flex justify-between items-center">
          <div className="flex items-center gap-[12px]">
            <Footprints size={18} className="text-[#FF4D1C]" />
            <div>
              <div className="text-[15px] font-semibold text-white tracking-[-0.1px]">
                12,000 steps
              </div>
              <div className="text-[13px] font-normal text-[#EBEBF599] mt-[2px]">
                Move more, recover better.
              </div>
            </div>
          </div>
          <div className="text-[11px] font-bold uppercase tracking-[0.04em] bg-[#FF4D1C]/10 text-[#FF4D1C] px-[10px] py-[4px] rounded-[100px]">
            Reminder
          </div>
        </div>
      </div>

      {/* Card 3: Today's meal ideas */}
      <div className="glass-card p-[20px] mb-[28px]">
        <div className="flex items-center gap-[8px] text-[13px] font-semibold uppercase tracking-[0.06em] text-[#EBEBF599] mb-[16px]">
          <Utensils size={14} /> Meal ideas to hit your protein
        </div>
        {remainingProtein !== undefined && remainingProtein <= 0 ? (
          <div className="text-[15px] font-medium text-[#D4FF00] flex items-center gap-[8px] mt-[12px]">
            <CheckCircle2 size={18} /> Protein target hit! Great work today.
          </div>
        ) : (
          <>
            <div className="text-[15px] font-normal text-[#EBEBF5CC] mb-[16px]">
              ~{remainingProtein !== undefined ? remainingProtein : 0}g protein
              remaining
            </div>
            <div className="space-y-[12px]">
              {/* Option A */}
              <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[12px] p-[16px] flex flex-col gap-[8px]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#EBEBF599]">
                  Option A
                </div>
                <div className="text-[15px] font-semibold text-white tracking-[-0.1px]">
                  {remainingProtein !== undefined && remainingProtein > 30
                    ? "4 whole eggs + 1 cup milk"
                    : remainingProtein !== undefined && remainingProtein > 15
                      ? "2 boiled eggs + 100g Greek yogurt"
                      : "1 boiled egg"}
                </div>
                <div className="flex gap-[8px] mt-[4px]">
                  <span className="bg-[rgba(55,138,221,0.15)] text-[#378ADD] text-[11px] font-semibold uppercase tracking-[0.04em] px-[10px] py-[4px] rounded-[100px]">
                    {remainingProtein !== undefined && remainingProtein > 30
                      ? "~28g protein"
                      : remainingProtein !== undefined && remainingProtein > 15
                        ? "~20g protein"
                        : "~6g protein"}
                  </span>
                  <span className="bg-[rgba(255,77,28,0.15)] text-[#FF4D1C] text-[11px] font-semibold uppercase tracking-[0.04em] px-[10px] py-[4px] rounded-[100px]">
                    {remainingProtein !== undefined && remainingProtein > 30
                      ? "~350 kcal"
                      : remainingProtein !== undefined && remainingProtein > 15
                        ? "~200 kcal"
                        : "~70 kcal"}
                  </span>
                </div>
              </div>

              {/* Option B */}
              <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[12px] p-[16px] flex flex-col gap-[8px]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#EBEBF599]">
                  Option B
                </div>
                <div className="text-[15px] font-semibold text-white tracking-[-0.1px]">
                  {remainingProtein !== undefined && remainingProtein > 40
                    ? "250g chicken breast (grilled)"
                    : remainingProtein !== undefined && remainingProtein > 20
                      ? "150g chicken breast"
                      : "100g chicken breast"}
                </div>
                <div className="flex gap-[8px] mt-[4px]">
                  <span className="bg-[rgba(55,138,221,0.15)] text-[#378ADD] text-[11px] font-semibold uppercase tracking-[0.04em] px-[10px] py-[4px] rounded-[100px]">
                    {remainingProtein !== undefined && remainingProtein > 40
                      ? "~55g protein"
                      : remainingProtein !== undefined && remainingProtein > 20
                        ? "~33g protein"
                        : "~22g protein"}
                  </span>
                  <span className="bg-[rgba(255,77,28,0.15)] text-[#FF4D1C] text-[11px] font-semibold uppercase tracking-[0.04em] px-[10px] py-[4px] rounded-[100px]">
                    {remainingProtein !== undefined && remainingProtein > 40
                      ? "~280 kcal"
                      : remainingProtein !== undefined && remainingProtein > 20
                        ? "~165 kcal"
                        : "~110 kcal"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center relative py-[4px]">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[rgba(255,255,255,0.06)]"></div>
                </div>
                <div className="relative bg-[#1C1C1E] px-[12px] text-[11px] font-semibold uppercase tracking-[0.06em] text-[#EBEBF599]">
                  OR
                </div>
              </div>

              {/* Option C */}
              <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[12px] p-[16px] flex flex-col gap-[8px]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#EBEBF599]">
                  Option C
                </div>
                <div className="text-[15px] font-semibold text-white tracking-[-0.1px]">
                  {remainingProtein !== undefined && remainingProtein > 40
                    ? "300g low-fat paneer OR 150g soya chunks"
                    : remainingProtein !== undefined && remainingProtein > 20
                      ? "200g low-fat paneer OR 100g soya chunks"
                      : "100g paneer OR 50g soya chunks"}
                </div>
                <div className="flex gap-[8px] mt-[4px]">
                  <span className="bg-[rgba(55,138,221,0.15)] text-[#378ADD] text-[11px] font-semibold uppercase tracking-[0.04em] px-[10px] py-[4px] rounded-[100px]">
                    {remainingProtein !== undefined && remainingProtein > 40
                      ? "~54g or ~52g protein"
                      : remainingProtein !== undefined && remainingProtein > 20
                        ? "~36g protein"
                        : "~18g protein"}
                  </span>
                  <span className="bg-[rgba(255,77,28,0.15)] text-[#FF4D1C] text-[11px] font-semibold uppercase tracking-[0.04em] px-[10px] py-[4px] rounded-[100px]">
                    {remainingProtein !== undefined && remainingProtein > 40
                      ? "~400 kcal"
                      : remainingProtein !== undefined && remainingProtein > 20
                        ? "~250 kcal"
                        : "~130 kcal"}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex gap-[12px]">
        <button
          onClick={() => navigate("/meals")}
          className="flex-1 bg-[#D4FF00] text-[#0A0A0A] font-bold text-[15px] rounded-[100px] p-[16px_20px] border-none tracking-[-0.2px] hover:scale-[1.02] hover:opacity-[0.95] active:scale-[0.97] transition-all"
        >
          Log Meal
        </button>
      </div>
    </div>
  );
}
