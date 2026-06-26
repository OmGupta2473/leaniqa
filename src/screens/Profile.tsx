import { useAppStore } from "../store";

export function ProfileScreen() {
  const { setScreen, onboardingData } = useAppStore();

  // Extract from state
  const name = onboardingData?.name ?? "";
  const age = onboardingData?.age;
  const gender = onboardingData?.gender;
  const activityLevel = onboardingData?.activityLevel;
  const weightKg = onboardingData?.weightKg;
  const heightCm = onboardingData?.heightCm;
  const tdee = onboardingData?.tdee;
  const proteinMin = onboardingData?.proteinMin;
  const proteinMax = onboardingData?.proteinMax;
  const fatMin = onboardingData?.fatMin;
  const fatMax = onboardingData?.fatMax;
  const carbMin = onboardingData?.carbMin;
  const carbMax = onboardingData?.carbMax;
  const fiberMin = onboardingData?.fiberMin;
  const fiberMax = onboardingData?.fiberMax;
  const waterLitres = onboardingData?.waterLitres;

  const currentBodyFatPct = onboardingData?.currentBodyFatPct;
  const targetBodyFatPct = onboardingData?.targetBodyFatPct;
  const fatToLoseKg = onboardingData?.fatToLoseKg;
  const targetWeightKg = onboardingData?.targetWeightKg;
  const chosenStrategyName = onboardingData?.chosenStrategyName;
  const dailyCalorieGoal = onboardingData?.dailyCalorieGoal;
  const dailyDeficit = onboardingData?.dailyDeficit;
  const estimatedWeeks = onboardingData?.estimatedWeeks;
  const estimatedCompletionDate = onboardingData?.estimatedCompletionDate;

  // Generate initials
  let initials = "—";
  if (name && name.trim().length > 0) {
    const words = name.trim().split(" ");
    if (words.length > 1) {
      initials = (
        words[0].charAt(0) + words[words.length - 1].charAt(0)
      ).toUpperCase();
    } else {
      initials = words[0].substring(0, 2).toUpperCase();
    }
  }

  // Display value helper
  const displayVal = (val: any) =>
    val !== undefined && val !== null && !Number.isNaN(val) ? val : "—";

  // Height display logic
  let heightStr = displayVal(heightCm);
  let heightSub = null;
  if (heightCm && heightCm >= 150) {
    const feet = Math.floor(heightCm / 30.48);
    const inches = Math.round((heightCm / 2.54) % 12);
    heightSub = `${feet}'${inches}"`;
  }

  // Date formatting
  let dateStr = "—";
  if (estimatedCompletionDate) {
    const d = new Date(estimatedCompletionDate);
    if (!isNaN(d.getTime())) {
      dateStr = d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } else {
      dateStr = estimatedCompletionDate;
    }
  }

  return (
    <div className="profile-screen">
      <div className="profile-scroll-area">
        {/* SECTION 1 — Header bar */}
        <div className="profile-header">
          <i
            className="ti ti-arrow-left"
            style={{ fontSize: "22px", color: "#FFFFFF", cursor: "pointer" }}
            aria-label="Go back"
            onClick={() => setScreen("dash")}
          ></i>
          <div
            style={{
              fontSize: "var(--font-2xl)",
              fontWeight: 700,
              color: "#FFFFFF",
              letterSpacing: "-0.3px",
            }}
          >
            Profile
          </div>
          <i
            className="ti ti-edit"
            style={{ fontSize: "20px", color: "rgba(235,235,245,0.6)" }}
          ></i>
        </div>

        {/* SECTION 2 — Avatar and identity card */}
        <div
          className="avatar-section"
          style={{ textAlign: "center", marginBottom: "24px" }}
        >
          <div className="profile-avatar">{initials}</div>
          <div
            style={{
              fontSize: "var(--font-3xl)",
              fontWeight: 700,
              color: "#FFFFFF",
              letterSpacing: "-0.4px",
              marginBottom: "8px",
            }}
          >
            {displayVal(name)}
          </div>

          <div className="identity-row">
            <div className="identity-pill">
              {gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : "—"}
            </div>
            <div className="identity-pill">{displayVal(age)} yrs</div>
            <div className="identity-pill">{displayVal(activityLevel)}</div>
          </div>
          <div
            style={{
              borderBottom: "0.5px solid rgba(255,255,255,0.08)",
              paddingBottom: "20px",
              marginBottom: "4px",
            }}
          ></div>
        </div>

        {/* SECTION 3 — Body stats card */}
        <div className="profile-card">
          <div className="profile-card-label">Body stats</div>
          <div className="stats-grid">
            <div className="stat-tile">
              <div className="stat-tile-label">Weight</div>
              <div className="stat-tile-value">
                {displayVal(weightKg)}{" "}
                <span className="stat-tile-unit">kg</span>
              </div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-label">Height</div>
              <div className="stat-tile-value">
                {heightStr} <span className="stat-tile-unit">cm</span>
              </div>
              {heightSub && (
                <div
                  style={{
                    fontSize: "var(--font-xs)",
                    color: "rgba(235,235,245,0.45)",
                  }}
                >
                  {heightSub}
                </div>
              )}
            </div>
            <div className="stat-tile">
              <div className="stat-tile-label">Current body fat</div>
              <div className="stat-tile-value">
                {displayVal(currentBodyFatPct)}
                <span className="stat-tile-unit">%</span>
              </div>
            </div>
            <div
              className="stat-tile"
              style={{
                background: "rgba(212,255,0,0.08)",
                border: "0.5px solid rgba(212,255,0,0.2)",
              }}
            >
              <div
                className="stat-tile-label"
                style={{ color: "rgba(212,255,0,0.6)" }}
              >
                Target body fat
              </div>
              <div className="stat-tile-value" style={{ color: "#D4FF00" }}>
                {displayVal(targetBodyFatPct)}
                <span
                  className="stat-tile-unit"
                  style={{ color: "rgba(212,255,0,0.6)" }}
                >
                  %
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4 — Nutrition targets card */}
        <div className="profile-card">
          <div className="profile-card-label">Daily nutrition targets</div>

          <div className="nutrition-profile-row">
            <div className="np-label">
              <div
                className="np-icon"
                style={{ background: "rgba(212,255,0,0.15)" }}
              >
                <i
                  className="ti ti-flame"
                  style={{ color: "#D4FF00", fontSize: "14px" }}
                ></i>
              </div>
              Calories
            </div>
            <div className="np-value" style={{ color: "#D4FF00" }}>
              {displayVal(tdee)} kcal
            </div>
          </div>

          <div className="nutrition-profile-row">
            <div className="np-label">
              <div
                className="np-icon"
                style={{ background: "rgba(255,77,28,0.15)" }}
              >
                <i
                  className="ti ti-meat"
                  style={{ color: "#FF4D1C", fontSize: "14px" }}
                ></i>
              </div>
              Protein
            </div>
            <div className="np-value">
              {displayVal(proteinMin)}–{displayVal(proteinMax)} g/day
            </div>
          </div>

          <div className="nutrition-profile-row">
            <div className="np-label">
              <div
                className="np-icon"
                style={{ background: "rgba(55,138,221,0.15)" }}
              >
                <i
                  className="ti ti-droplet"
                  style={{ color: "#378ADD", fontSize: "14px" }}
                ></i>
              </div>
              Fat
            </div>
            <div className="np-value">
              {displayVal(fatMin)}–{displayVal(fatMax)} g/day
            </div>
          </div>

          <div className="nutrition-profile-row">
            <div className="np-label">
              <div
                className="np-icon"
                style={{ background: "rgba(186,117,23,0.15)" }}
              >
                <i
                  className="ti ti-grain"
                  style={{ color: "#BA7517", fontSize: "14px" }}
                ></i>
              </div>
              Carbohydrates
            </div>
            <div className="np-value">
              {displayVal(carbMin)}–{displayVal(carbMax)} g/day
            </div>
          </div>

          <div className="nutrition-profile-row">
            <div className="np-label">
              <div
                className="np-icon"
                style={{ background: "rgba(99,153,34,0.15)" }}
              >
                <i
                  className="ti ti-leaf"
                  style={{ color: "#639922", fontSize: "14px" }}
                ></i>
              </div>
              Fiber
            </div>
            <div className="np-value">
              {displayVal(fiberMin)}–{displayVal(fiberMax)} g/day
            </div>
          </div>

          <div className="nutrition-profile-row">
            <div className="np-label">
              <div
                className="np-icon"
                style={{ background: "rgba(55,138,221,0.12)" }}
              >
                <i
                  className="ti ti-droplets"
                  style={{ color: "#378ADD", fontSize: "14px" }}
                ></i>
              </div>
              Water
            </div>
            <div className="np-value">{displayVal(waterLitres)} L/day</div>
          </div>
        </div>

        {/* SECTION 5 — Transformation goal card */}
        <div className="profile-card">
          <div className="profile-card-label">Transformation goal</div>

          <div className="nutrition-profile-row">
            <div className="np-label">
              <div
                className="np-icon"
                style={{ background: "rgba(255,77,28,0.15)" }}
              >
                <i
                  className="ti ti-trending-down"
                  style={{ color: "#FF4D1C", fontSize: "14px" }}
                ></i>
              </div>
              Fat to lose
            </div>
            <div className="np-value">{displayVal(fatToLoseKg)} kg</div>
          </div>

          <div className="nutrition-profile-row">
            <div className="np-label">
              <div
                className="np-icon"
                style={{ background: "rgba(55,138,221,0.15)" }}
              >
                <i
                  className="ti ti-target"
                  style={{ color: "#378ADD", fontSize: "14px" }}
                ></i>
              </div>
              Target weight
            </div>
            <div className="np-value">{displayVal(targetWeightKg)} kg</div>
          </div>

          <div className="nutrition-profile-row">
            <div className="np-label">
              <div
                className="np-icon"
                style={{ background: "rgba(212,255,0,0.15)" }}
              >
                <i
                  className="ti ti-bolt"
                  style={{ color: "#D4FF00", fontSize: "14px" }}
                ></i>
              </div>
              Strategy
            </div>
            <div className="np-value" style={{ color: "#D4FF00" }}>
              {displayVal(chosenStrategyName)}
            </div>
          </div>

          <div className="nutrition-profile-row">
            <div className="np-label">
              <div
                className="np-icon"
                style={{ background: "rgba(212,255,0,0.15)" }}
              >
                <i
                  className="ti ti-flame"
                  style={{ color: "#D4FF00", fontSize: "14px" }}
                ></i>
              </div>
              Daily calorie goal
            </div>
            <div className="np-value">{displayVal(dailyCalorieGoal)} kcal</div>
          </div>

          <div className="nutrition-profile-row">
            <div className="np-label">
              <div
                className="np-icon"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
                <i
                  className="ti ti-minus"
                  style={{ color: "#FFFFFF", fontSize: "14px" }}
                ></i>
              </div>
              Daily deficit
            </div>
            <div className="np-value">{displayVal(dailyDeficit)} kcal</div>
          </div>

          <div className="nutrition-profile-row">
            <div className="np-label">
              <div
                className="np-icon"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
                <i
                  className="ti ti-calendar"
                  style={{ color: "#FFFFFF", fontSize: "14px" }}
                ></i>
              </div>
              Estimated time
            </div>
            <div className="np-value">{displayVal(estimatedWeeks)} weeks</div>
          </div>

          <div className="nutrition-profile-row">
            <div className="np-label">
              <div
                className="np-icon"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
                <i
                  className="ti ti-flag"
                  style={{ color: "#FFFFFF", fontSize: "14px" }}
                ></i>
              </div>
              Target date
            </div>
            <div className="np-value">{dateStr}</div>
          </div>
        </div>

        {/* SECTION 6 — Progress bar visual */}
        <div className="progress-section">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "var(--font-sm)",
            }}
          >
            <span style={{ color: "rgba(235,235,245,0.6)" }}>
              Body fat journey
            </span>
            <span style={{ color: "#FFFFFF" }}>
              {displayVal(currentBodyFatPct)}% → {displayVal(targetBodyFatPct)}%
            </span>
          </div>
          <div className="journey-track">
            {/* Using 5% as default if there is no real progress stored yet, per instructions */}
            <div className="journey-fill" style={{ width: "5%" }}></div>
          </div>
          <div
            style={{
              fontSize: "var(--font-xs)",
              color: "rgba(235,235,245,0.4)",
              marginTop: "8px",
            }}
          >
            {displayVal(estimatedWeeks)} weeks to goal · by {dateStr}
          </div>
        </div>

        {/* SECTION 7 — Bottom padding */}
        <div className="profile-bottom-spacer"></div>
      </div>
    </div>
  );
}
