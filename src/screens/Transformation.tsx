import React, { useEffect } from "react";
import { useUserStore } from "../store/user";
import { useQuery } from "@tanstack/react-query";
import { profileService } from "../services/profileService";
import { useNavigate } from "react-router-dom";

export function TransformationScreen() {
  const onboardingData = useUserStore(s => s.onboardingData);
  const navigate = useNavigate();

  useEffect(() => {
    const el = document.querySelector('.transformation-screen');
    if (el) el.scrollTop = 0;
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileService.getProfile(),
  });
  const { data: goal } = useQuery({
    queryKey: ["goal"],
    queryFn: () => profileService.getGoal(),
  });

  // Read all values from existing app state
  const name = profile?.name ?? onboardingData?.name;
  const gender = profile?.gender ?? onboardingData?.gender;
  const weightKg = profile?.weight ?? onboardingData?.weightKg;
  const currentBodyFatPct =
    goal?.current_bf ?? onboardingData?.currentBodyFatPct;
  const targetBodyFatPct = goal?.target_bf ?? onboardingData?.targetBodyFatPct;
  const fatToLoseKg = onboardingData?.fatToLoseKg;
  const targetWeightKg = onboardingData?.targetWeightKg;
  const chosenStrategyName =
    goal?.strategy ?? onboardingData?.chosenStrategyName;
  const dailyDeficit = goal?.deficit_kcal ?? onboardingData?.dailyDeficit;

  const dailyCalorieGoal =
    profile?.maintenance_kcal && goal?.deficit_kcal !== undefined
      ? profile.maintenance_kcal - goal.deficit_kcal
      : onboardingData?.dailyCalorieGoal;

  let estimatedWeeks = onboardingData?.estimatedWeeks;
  let estimatedCompletionDate = onboardingData?.estimatedCompletionDate;

  // Re-calculate projected date string if we have goal data from DB
  if (goal?.target_date) {
    const targetDateObj = new Date(goal.target_date);
    if (!isNaN(targetDateObj.getTime())) {
      estimatedCompletionDate = targetDateObj.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      // Calculate weeks difference roughly if not using onboardingData
      const start = goal.created_at ? new Date(goal.created_at) : new Date();
      const diffMs = targetDateObj.getTime() - start.getTime();
      const diffWeeks = Math.max(
        1,
        Math.round(diffMs / (1000 * 60 * 60 * 24 * 7)),
      );
      if (!estimatedWeeks) estimatedWeeks = diffWeeks;
    }
  }

  // Display fallback
  const displayVal = (val: any) =>
    val !== undefined && val !== null ? val : "—";

  // Body Fat SVG Selector
  const getBodySvg = (bf: number | undefined | null) => {
    if (bf === undefined || bf === null) return "slim";
    if (bf > 25) return "wide";
    if (bf >= 15 && bf <= 25) return "moderate";
    return "slim";
  };

  const currentSilhouette = getBodySvg(currentBodyFatPct);
  // Goal is always slim
  const goalSilhouette = "slim";

  // Strategy description logic
  let strategyDescription = `Daily deficit of ${displayVal(dailyDeficit)} kcal`;
  if (chosenStrategyName) {
    if (chosenStrategyName.includes("Aggressive")) {
      strategyDescription = "−600 kcal/day · fastest route to goal";
    } else if (chosenStrategyName.includes("Recommended")) {
      strategyDescription =
        "−400 kcal/day · best balance of speed and muscle retention";
    } else if (
      chosenStrategyName.includes("Steady") ||
      chosenStrategyName.includes("Sustainable")
    ) {
      strategyDescription =
        "−200 kcal/day · most sustainable, maximum muscle retention";
    }
  }

  // Calculate timeline progress
  let currentDay = 0;
  let totalDays = 0;
  let isMaintenance = dailyDeficit === 0;

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
  } else if (estimatedWeeks && !isMaintenance) {
    totalDays = estimatedWeeks * 7;
    currentDay = 0;
  }

  const progressPercent =
    totalDays > 0
      ? Math.min(100, Math.max(0, (currentDay / totalDays) * 100))
      : 0;

  // Format completion date nicely
  let completionDateStr = displayVal(estimatedCompletionDate);
  if (
    completionDateStr !== "—" &&
    typeof completionDateStr === "string" &&
    !completionDateStr.includes(",")
  ) {
    // If it's just 'March 2027' make it look nice, if it's full date try to format it
    const d = new Date(completionDateStr);
    if (!isNaN(d.getTime())) {
      completionDateStr = d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  }

  // Render SVG function
  const renderSvg = (type: "wide" | "moderate" | "slim") => {
    if (type === "wide") {
      return (
        <svg
          width="60"
          height="110"
          viewBox="0 0 60 110"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="30"
            cy="14"
            r="10"
            fill="rgba(255,255,255,0.15)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.5"
          />
          <rect
            x="26"
            y="23"
            width="8"
            height="8"
            rx="2"
            fill="rgba(255,255,255,0.12)"
          />
          <path
            d="M10 35 Q8 55 10 80 Q18 88 30 88 Q42 88 50 80 Q52 55 50 35 Q42 30 30 30 Q18 30 10 35Z"
            fill="rgba(255,255,255,0.1)"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="0.5"
          />
          <path
            d="M10 38 Q4 52 6 68"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M50 38 Q56 52 54 68"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M22 88 Q20 100 20 110"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M38 88 Q40 100 40 110"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </svg>
      );
    } else if (type === "moderate") {
      return (
        <svg
          width="60"
          height="110"
          viewBox="0 0 60 110"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="30"
            cy="14"
            r="10"
            fill="rgba(255,255,255,0.15)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.5"
          />
          <rect
            x="26"
            y="23"
            width="8"
            height="8"
            rx="2"
            fill="rgba(255,255,255,0.12)"
          />
          <path
            d="M13 35 Q11 55 14 78 Q20 84 30 84 Q40 84 46 78 Q49 55 47 35 Q40 30 30 30 Q20 30 13 35Z"
            fill="rgba(255,255,255,0.1)"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="0.5"
          />
          <path
            d="M13 38 Q8 52 10 68"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M47 38 Q52 52 50 68"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M23 84 Q22 100 22 110"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M37 84 Q38 100 38 110"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </svg>
      );
    } else {
      // slim
      return (
        <svg
          width="60"
          height="110"
          viewBox="0 0 60 110"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="30"
            cy="14"
            r="10"
            fill="rgba(255,255,255,0.15)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.5"
          />
          <rect
            x="26"
            y="23"
            width="8"
            height="8"
            rx="2"
            fill="rgba(255,255,255,0.12)"
          />
          <path
            d="M16 35 Q15 55 18 76 Q23 80 30 80 Q37 80 42 76 Q45 55 44 35 Q37 30 30 30 Q23 30 16 35Z"
            fill="rgba(255,255,255,0.1)"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="0.5"
          />
          <path
            d="M16 38 Q12 52 14 68"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M44 38 Q48 52 46 68"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M24 80 Q24 100 24 110"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M36 80 Q36 100 36 110"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>
      );
    }
  };

  return (
    <div className="transformation-screen">
      <div className="transform-header">
        <i
          className="ti ti-arrow-left"
          style={{ fontSize: "22px", color: "#FFFFFF", cursor: "pointer" }}
          aria-label="Go back"
          onClick={() => navigate("/dashboard")}
        ></i>
        <h1
          style={{
            fontSize: "var(--font-2xl)",
            fontWeight: 700,
            color: "white",
            letterSpacing: "-0.3px",
            margin: 0,
          }}
        >
          Transformation
        </h1>
        <i
          className="ti ti-share"
          style={{ fontSize: "20px", color: "rgba(235,235,245,0.5)" }}
          aria-hidden="true"
        ></i>
      </div>

      <div className="transformation-scroll-area">
        {/* Physique Comparison Card */}
        <div className="physique-card">
          <div className="physique-comparison">
            {/* Left - Current */}
            <div className="physique-current">
              {renderSvg(currentSilhouette)}
              <div className="physique-label">
                <div className="physique-pct">
                  {displayVal(currentBodyFatPct)}%
                </div>
                <div className="physique-sublabel">Current</div>
              </div>
            </div>

            {/* Center divider */}
            <div className="physique-divider">
              <i
                className="ti ti-arrow-right"
                style={{ fontSize: "16px", color: "#0A0A0A", fontWeight: 700 }}
                aria-hidden="true"
              ></i>
            </div>

            {/* Right - Goal */}
            <div
              className="physique-current"
              style={{
                background:
                  "linear-gradient(180deg, rgba(212,255,0,0.06) 0%, rgba(28,28,30,0.95) 100%)",
                borderRight: "none",
                boxShadow: "inset 2px 0 20px rgba(212,255,0,0.04)",
              }}
            >
              {renderSvg(goalSilhouette)}
              <div className="physique-label">
                <div className="physique-pct" style={{ color: "#D4FF00" }}>
                  {displayVal(targetBodyFatPct)}%
                </div>
                <div className="physique-sublabel">Goal</div>
              </div>
            </div>
          </div>

          <div className="physique-bottom-strip">
            <div>
              <div
                style={{
                  fontSize: "var(--font-xs)",
                  color: "rgba(235,235,245,0.6)",
                  textTransform: "uppercase",
                  marginBottom: "2px",
                }}
              >
                Fat to lose
              </div>
              <div
                style={{
                  fontSize: "var(--font-xl)",
                  fontWeight: 700,
                  color: "#FFFFFF",
                }}
              >
                {displayVal(fatToLoseKg)} kg
              </div>
            </div>
            <div
              style={{
                borderLeft: "0.5px solid rgba(255,255,255,0.08)",
                height: "32px",
              }}
            ></div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: "var(--font-xs)",
                  color: "rgba(235,235,245,0.6)",
                  textTransform: "uppercase",
                  marginBottom: "2px",
                }}
              >
                Target weight
              </div>
              <div
                style={{
                  fontSize: "var(--font-xl)",
                  fontWeight: 700,
                  color: "#FFFFFF",
                }}
              >
                {displayVal(targetWeightKg)} kg
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Section */}
        <div className="timeline-section">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "var(--font-sm)",
                color: "rgba(235,235,245,0.6)",
                textTransform: "uppercase",
                fontWeight: 500,
              }}
            >
              Journey progress
            </span>
            <span
              style={{
                fontSize: "var(--font-sm)",
                color: "#FFFFFF",
                fontWeight: 500,
              }}
            >
              Day {currentDay} of {totalDays}
            </span>
          </div>

          <div className="timeline-track">
            <div
              className="timeline-fill"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          <div className="milestone-row">
            <span className="milestone active">Start</span>
            <span
              className={`milestone ${progressPercent >= 50 ? "active" : ""}`}
            >
              50%
            </span>
            <span
              className={`milestone ${progressPercent >= 100 ? "active" : ""}`}
            >
              Goal {completionDateStr !== "—" && `· ${completionDateStr}`}
            </span>
          </div>
        </div>

        {/* Transformation Goals Card */}
        <div
          className="goals-card"
          style={{ margin: "0 20px clamp(12px, 3vw, 16px)" }}
        >
          <div
            style={{
              fontSize: "15px",
              fontWeight: 600,
              color: "white",
              marginBottom: "10px",
              paddingLeft: "4px",
            }}
          >
            Transformation goals
          </div>
          <div
            className="profile-card"
            style={{ padding: "0 clamp(16px, 4vw, 20px)" }}
          >
            <div className="goal-row">
              <div className="goal-row-left">
                <div
                  className="goal-icon-wrap"
                  style={{ background: "rgba(255,77,28,0.15)" }}
                >
                  <i
                    className="ti ti-trending-down"
                    style={{ fontSize: "16px", color: "#FF4D1C" }}
                    aria-hidden="true"
                  ></i>
                </div>
                <div className="goal-row-label">Fat to lose</div>
              </div>
              <div className="goal-row-value">{displayVal(fatToLoseKg)} kg</div>
            </div>

            <div className="goal-row">
              <div className="goal-row-left">
                <div
                  className="goal-icon-wrap"
                  style={{ background: "rgba(55,138,221,0.15)" }}
                >
                  <i
                    className="ti ti-target"
                    style={{ fontSize: "16px", color: "#378ADD" }}
                    aria-hidden="true"
                  ></i>
                </div>
                <div className="goal-row-label">Target weight</div>
              </div>
              <div className="goal-row-value">
                {displayVal(targetWeightKg)} kg
              </div>
            </div>

            <div className="goal-row">
              <div className="goal-row-left">
                <div
                  className="goal-icon-wrap"
                  style={{ background: "rgba(212,255,0,0.12)" }}
                >
                  <i
                    className="ti ti-bolt"
                    style={{ fontSize: "16px", color: "#D4FF00" }}
                    aria-hidden="true"
                  ></i>
                </div>
                <div className="goal-row-label">Strategy</div>
              </div>
              <div className="goal-row-value" style={{ color: "#D4FF00" }}>
                {displayVal(chosenStrategyName)}
              </div>
            </div>

            <div className="goal-row">
              <div className="goal-row-left">
                <div
                  className="goal-icon-wrap"
                  style={{ background: "rgba(212,255,0,0.12)" }}
                >
                  <i
                    className="ti ti-flame"
                    style={{ fontSize: "16px", color: "#D4FF00" }}
                    aria-hidden="true"
                  ></i>
                </div>
                <div className="goal-row-label">Daily calorie goal</div>
              </div>
              <div className="goal-row-value">
                {displayVal(dailyCalorieGoal)} kcal
              </div>
            </div>

            <div className="goal-row">
              <div className="goal-row-left">
                <div
                  className="goal-icon-wrap"
                  style={{ background: "rgba(255,59,48,0.12)" }}
                >
                  <i
                    className="ti ti-minus"
                    style={{ fontSize: "16px", color: "#FF3B30" }}
                    aria-hidden="true"
                  ></i>
                </div>
                <div className="goal-row-label">Daily deficit</div>
              </div>
              <div className="goal-row-value">
                {displayVal(dailyDeficit)} kcal
              </div>
            </div>

            <div className="goal-row">
              <div className="goal-row-left">
                <div
                  className="goal-icon-wrap"
                  style={{ background: "rgba(99,153,34,0.15)" }}
                >
                  <i
                    className="ti ti-calendar"
                    style={{ fontSize: "16px", color: "#639922" }}
                    aria-hidden="true"
                  ></i>
                </div>
                <div className="goal-row-label">Estimated time</div>
              </div>
              <div className="goal-row-value">
                {displayVal(estimatedWeeks)} weeks
              </div>
            </div>

            <div className="goal-row">
              <div className="goal-row-left">
                <div
                  className="goal-icon-wrap"
                  style={{ background: "rgba(186,117,23,0.15)" }}
                >
                  <i
                    className="ti ti-flag"
                    style={{ fontSize: "16px", color: "#BA7517" }}
                    aria-hidden="true"
                  ></i>
                </div>
                <div className="goal-row-label">Target date</div>
              </div>
              <div className="goal-row-value">{completionDateStr}</div>
            </div>
          </div>
        </div>

        {/* Strategy Highlight */}
        <div className="strategy-highlight">
          <div className="strategy-icon-large">
            <i
              className="ti ti-bolt"
              style={{ fontSize: "22px", color: "#D4FF00" }}
              aria-hidden="true"
            ></i>
          </div>
          <div>
            <div
              style={{
                fontSize: "var(--font-lg)",
                fontWeight: 700,
                color: "#D4FF00",
                marginBottom: "2px",
              }}
            >
              {displayVal(chosenStrategyName)}
            </div>
            <div
              style={{
                fontSize: "var(--font-sm)",
                fontWeight: 400,
                color: "rgba(235,235,245,0.55)",
              }}
            >
              {strategyDescription}
            </div>
          </div>
        </div>

        <div className="transform-bottom-spacer"></div>
      </div>
    </div>
  );
}
