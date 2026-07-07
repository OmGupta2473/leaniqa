import { useNavigate } from "react-router-dom";
import React, { useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { profileService } from "@/features/profile/services/profileService";
import { mealService } from "../services/mealService";
import { useCalculatedProfile } from "@/shared/hooks/useCalculatedProfile";
import { useUserStore } from "@/features/profile/store/userStore";

import { calculateEarnedAwards, calculateCurrentDailyStreak } from "@/shared/utils/streaks";
import { reportService } from "@/features/reports/services/reportService";
import { DailyHistoryChart } from "../components/DailyHistoryChart";

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
const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileService.getProfile(),
  });
  const { data: goal } = useQuery({
    queryKey: ["goal"],
    queryFn: () => profileService.getGoal(),
  });
  const { data: meals } = useQuery({
    queryKey: ["meals", "today"],
    queryFn: () => mealService.getTodaysMeals(),
  });

  const dailyCalorieGoal =
    profile?.maintenance_kcal && goal?.deficit_kcal !== undefined
      ? profile.maintenance_kcal - goal.deficit_kcal
      : (onboardingData?.dailyCalorieGoal ?? 2000);

  // find today's log, if it exists
  const todayStr = getLocalDateString();
  const caloriesConsumed = meals ? meals.reduce((acc, m) => acc + m.calories, 0) : 0;

  const isUnderTarget = caloriesConsumed <= dailyCalorieGoal;
// Inject live data for today's chart entry
  const chartLogs = useMemo(() => {
    const logs = [...metrics];
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
  }, [metrics, todayStr, caloriesConsumed, dailyCalorieGoal, isUnderTarget]);

  const chartData = useMemo(() => {
    return chartLogs.map(l => ({
      date: l.date,
      actual: l.actual_calories,
      target: l.target_calories
    }));
  }, [chartLogs]);

  return (
    <div
      className="screen-container screen-enter"
      style={{ minHeight: "100dvh", background: "#1c1c1e", overflowY: "auto" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-[20px] pt-[calc(env(safe-area-inset-top)+20px)]">
        <i
          className="ti ti-arrow-left text-[22px] text-white cursor-pointer"
          onClick={() => navigate("/dashboard")}
        ></i>
        <h1
          style={{
            fontSize: "var(--font-xl)",
            fontWeight: 700,
            color: "white",
            margin: 0,
            letterSpacing: "-0.3px",
          }}
        >
          Calorie History
        </h1>
        <i className="ti ti-share text-[20px] text-[rgba(235,235,245,0.5)]"></i>
      </div>

      <div className="px-[20px] pb-[40px]">
        {/* Today's summary card */}
        <div className="glass-card p-[20px] mb-[16px] relative overflow-hidden flex flex-col items-center">
          <div className="text-[13px] font-semibold uppercase tracking-[0.05em] text-[#EBEBF599] mb-[8px]">
            Today's Intake
          </div>
          <div className="flex items-baseline gap-[4px] mb-[12px]">
            <span
              style={{
                fontSize: "var(--font-stat)",
                fontWeight: 700,
                color: "white",
                letterSpacing: "-0.5px",
              }}
            >
              {caloriesConsumed}
            </span>
            <span
              style={{
                fontSize: "var(--font-xl)",
                color: "rgba(235,235,245,0.4)",
                fontWeight: 500,
              }}
            >
              / {dailyCalorieGoal} kcal
            </span>
          </div>

          <div className="flex items-center justify-center gap-[12px]">
            <div
              style={{
                background: isUnderTarget
                  ? "rgba(212,255,0,0.15)"
                  : "rgba(255,77,28,0.15)",
                color: isUnderTarget ? "#D4FF00" : "#FF4D1C",
                padding: "6px 12px",
                borderRadius: "100px",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              {isUnderTarget ? "Under Target ✓*" : "Over Target ✗*"}
            </div>


          </div>
        </div>

        {/* Bar chart section */}
        <div className="mb-[12px] text-[13px] font-semibold uppercase tracking-[0.05em] text-[#EBEBF599] ml-[4px]">
          Daily calorie history
        </div>
        
        <DailyHistoryChart 
          logs={chartData} 
          todayStr={todayStr} 
          unit="kcal" 
          type="calorie" 
        />

        <div style={{ fontSize: "11px", color: "rgba(235,235,245,0.5)", fontStyle: "italic", marginLeft: "4px", marginTop: "-8px", marginBottom: "32px" }}>
          * Still in calculation. Today's result will be finalized at the end of the day.
        </div>
      </div>
    </div>
  );
}
