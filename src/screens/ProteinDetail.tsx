import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { profileService } from "../services/profileService";
import { useAppStore } from "../store";

export function ProteinDetailScreen() {
  const { setScreen, dailyLogs, proteinStreak, earnedAwards, onboardingData } =
    useAppStore();
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileService.getProfile(),
  });

  const proteinTarget =
    profile?.protein_target ?? onboardingData?.proteinMid ?? 150;

  // find today's log, if it exists
  const todayStr = new Date().toISOString().split("T")[0];
  const todayLog = dailyLogs.find((l) => l.date === todayStr);
  const proteinConsumed = todayLog ? todayLog.proteinConsumed : 0;

  const isTargetHit = proteinConsumed >= proteinTarget;

  const allTimeBestProStreak = useMemo(() => {
    const logsToConsider = dailyLogs.filter(l => l.date !== todayStr);
    const sorted = [...logsToConsider].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    let best = 0,
      current = 0;
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].proteinHitTarget) {
        if (i === 0) {
          current = 1;
          continue;
        }
        const prev = new Date(sorted[i - 1].date);
        const curr = new Date(sorted[i].date);
        const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
        current = diff === 1 ? current + 1 : 1;
      } else {
        current = 0;
      }
      best = Math.max(best, current);
    }
    return Math.max(best, current);
  }, [dailyLogs]);

  // Build chart
  const buildProteinBarChart = (logs: typeof dailyLogs, target: number) => {
    const sorted = [...logs]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30);

    const chartWidth = 320;
    const chartHeight = 140;
    const barAreaHeight = 100;
    const maxVal = Math.max(
      ...sorted.map((d) => d.proteinConsumed),
      target * 1.3,
    );
    const barWidth = Math.max(6, chartWidth / Math.max(sorted.length, 1) - 3);

    let bars = "";
    sorted.forEach((day, i) => {
      const barH = (day.proteinConsumed / maxVal) * barAreaHeight;
      const x = i * (barWidth + 3);
      const y = barAreaHeight - barH;
      const color = day.proteinHitTarget ? "#FF4D1C" : "rgba(255,255,255,0.15)";
      bars += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="3" fill="${color}" opacity="0.85"/>`;
    });

    const lineY = barAreaHeight - (target / maxVal) * barAreaHeight;
    const targetLine = `<line x1="0" y1="${lineY}" x2="${chartWidth}" y2="${lineY}" stroke="rgba(255,77,28,0.5)" stroke-width="1" stroke-dasharray="4 4"/>`;
    const targetLabel = `<text x="${chartWidth - 2}" y="${lineY - 4}" text-anchor="end" font-size="9" fill="rgba(255,77,28,0.6)">target</text>`;

    let dayLabels = "";
    sorted.forEach((day, i) => {
      if (i % 5 === 0 || i === sorted.length - 1) {
        const x = i * (barWidth + 3) + barWidth / 2;
        const dayNum = i + 1;
        dayLabels += `<text x="${x}" y="${chartHeight}" text-anchor="middle" font-size="8" fill="rgba(235,235,245,0.35)">D${dayNum}</text>`;
      }
    });

    return `<svg width="100%" viewBox="0 0 ${chartWidth} ${chartHeight}" preserveAspectRatio="xMidYMid meet" overflow="visible">
      ${bars}${targetLine}${targetLabel}${dayLabels}
    </svg>`;
  };

  const chartHtml = buildProteinBarChart(dailyLogs, proteinTarget);
  const proAwards = earnedAwards.filter((a) => a.category === "protein");

  return (
    <div
      className="screen-container screen-enter"
      style={{ minHeight: "100dvh", background: "#1c1c1e", overflowY: "auto" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-[20px] pt-[calc(env(safe-area-inset-top)+20px)]">
        <i
          className="ti ti-arrow-left text-[22px] text-white cursor-pointer"
          onClick={() => setScreen("dash")}
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
          Protein History
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
              {proteinConsumed}
            </span>
            <span
              style={{
                fontSize: "var(--font-xl)",
                color: "rgba(235,235,245,0.4)",
                fontWeight: 500,
              }}
            >
              / {proteinTarget} g
            </span>
          </div>

          <div className="flex items-center justify-center gap-[12px]">
            <div
              style={{
                background: isTargetHit
                  ? "rgba(255,77,28,0.15)"
                  : "rgba(255,255,255,0.1)",
                color: isTargetHit ? "#FF4D1C" : "rgba(255,255,255,0.5)",
                padding: "6px 12px",
                borderRadius: "100px",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              {isTargetHit ? "Target hit ✓" : "Missed target ✗"}
            </div>

            <div
              style={{
                fontSize: "var(--font-sm)",
                color: "#FF4D1C",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              ⚡ {proteinStreak} day streak
            </div>
          </div>
        </div>

        {/* Streak Stats */}
        <div className="streak-stats-grid mb-[24px]">
          <div className="glass-card p-[16px] text-center">
            <div
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                color: "rgba(235,235,245,0.5)",
                fontWeight: 600,
                letterSpacing: "0.05em",
                marginBottom: "4px",
              }}
            >
              Current Streak
            </div>
            <div
              style={{
                fontSize: "var(--font-stat)",
                color: "#FF4D1C",
                fontWeight: 700,
              }}
            >
              {proteinStreak}
            </div>
          </div>
          <div className="glass-card p-[16px] text-center">
            <div
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                color: "rgba(235,235,245,0.5)",
                fontWeight: 600,
                letterSpacing: "0.05em",
                marginBottom: "4px",
              }}
            >
              Best Streak
            </div>
            <div
              style={{
                fontSize: "var(--font-stat)",
                color: "white",
                fontWeight: 700,
              }}
            >
              {allTimeBestProStreak}
            </div>
          </div>
        </div>

        {/* Bar chart section */}
        <div className="mb-[12px] text-[13px] font-semibold uppercase tracking-[0.05em] text-[#EBEBF599] ml-[4px]">
          Daily protein history
        </div>
        <div
          className="chart-container mb-[12px]"
          dangerouslySetInnerHTML={{ __html: chartHtml }}
        />

        <div className="flex items-center gap-[16px] ml-[4px] mb-[32px]">
          <div className="flex items-center gap-[6px]">
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#FF4D1C",
              }}
            ></div>
            <span
              style={{
                fontSize: "var(--font-xs)",
                color: "rgba(235,235,245,0.5)",
              }}
            >
              Target hit
            </span>
          </div>
          <div className="flex items-center gap-[6px]">
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.15)",
              }}
            ></div>
            <span
              style={{
                fontSize: "var(--font-xs)",
                color: "rgba(235,235,245,0.5)",
              }}
            >
              Target missed
            </span>
          </div>
        </div>

        {/* Awards Progress */}
        <div className="mb-[12px] text-[13px] font-semibold uppercase tracking-[0.05em] text-[#EBEBF599] ml-[4px]">
          Awards Progress
        </div>
        <div className="flex flex-col gap-[12px]">
          {proAwards.map((award) => {
            const isEarned = award.earned;
            return (
              <div key={award.id} className="glass-card p-[16px] flex items-center gap-[12px]">
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: award.shape === "shield" ? "12px" : "50%", // Simple shield approx
                    background: isEarned
                      ? `linear-gradient(135deg, ${award.primaryColor}20, ${award.accentColor}40)`
                      : "rgba(255,255,255,0.05)",
                    border: `1px solid ${isEarned ? award.primaryColor + "80" : "rgba(255,255,255,0.1)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    opacity: isEarned ? 1 : 0.4,
                    flexShrink: 0,
                  }}
                >
                  {award.symbol}
                </div>
                <div className="flex-1">
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: isEarned ? "white" : "rgba(255,255,255,0.5)",
                    }}
                  >
                    {award.name}
                  </div>
                  {isEarned ? (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#FF4D1C",
                        fontWeight: 500,
                      }}
                    >
                      Earned{" "}
                      {award.earnedDate
                        ? new Date(award.earnedDate).toLocaleDateString()
                        : "recently"}
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: "11px",
                        color: "rgba(255,255,255,0.4)",
                        marginTop: "4px",
                      }}
                    >
                      Reach a {award.streakRequired}-day streak to unlock
                      <div
                        style={{
                          height: "4px",
                          background: "rgba(255,255,255,0.1)",
                          borderRadius: "2px",
                          marginTop: "6px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            background: "rgba(255,255,255,0.3)",
                            width: `${Math.min(100, (proteinStreak / award.streakRequired) * 100)}%`,
                            transition: "width 0.3s",
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
