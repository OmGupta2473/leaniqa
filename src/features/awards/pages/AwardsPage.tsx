import { useNavigate } from "react-router-dom";
import React, { useEffect } from "react";
import { useMemo } from 'react';
import { useAwardStore } from "../store/awardStore";
import { useQuery } from "@tanstack/react-query";
import { reportService } from "@/features/reports/services/reportService";
import { calculateEarnedAwards, calculateBestDailyStreak, calculateCurrentDailyStreak } from "@/shared/utils/streaks";

export function renderBadge(
  award: any,
  size: number,
  earned: boolean,
  animate: boolean,
) {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const r = s * 0.42;

  // Shape path: hexagon for calories, shield for protein
  function hexPath(cx: number, cy: number, r: number) {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30);
      pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
    }
    return `M ${pts.join(" L ")} Z`;
  }
  function shieldPath(cx: number, cy: number, r: number) {
    const w = r * 1.5;
    const h = r * 1.8;
    const top = cy - h * 0.5;
    const bot = cy + h * 0.5;
    const left = cx - w * 0.5;
    const right = cx + w * 0.5;
    return `M ${cx},${bot} C ${left},${bot - h * 0.25} ${left},${top + h * 0.35} ${left},${top + h * 0.15} L ${cx - w * 0.3},${top} L ${cx},${top - r * 0.1} L ${cx + w * 0.3},${top} L ${right},${top + h * 0.15} C ${right},${top + h * 0.35} ${right},${bot - h * 0.25} ${cx},${bot} Z`;
  }

  const shapePath =
    award.shape === "hexagon" ? hexPath(cx, cy, r) : shieldPath(cx, cy, r);

  // Colors: earned = vivid, unearned = greyscale
  const fillColor = earned ? award.primaryColor : "#3A3A3C";
  const textColor = earned ? "#0A0A0A" : "#666668";
  const opacity = earned ? 1 : 0.55;

  // Tier ring color
  const tierColors: Record<string, string> = {
    bronze: "#CD7F32",
    silver: "#C0C0C0",
    gold: "#FFD700",
  };
  const tierColor = earned ? tierColors[award.tier] : "#444446";

  // Glossy highlight overlay
  const glossy = `<ellipse cx="${cx}" cy="${cy - r * 0.2}" rx="${r * 0.55}" ry="${r * 0.28}" fill="rgba(255,255,255,${earned ? "0.18" : "0.05"})" />`;

  // Symbol number text
  const fontSize = s * 0.28;
  const symbolEl = `<text x="${cx}" y="${cy + fontSize * 0.38}" text-anchor="middle" font-size="${fontSize}" font-weight="800" font-family="-apple-system, 'Inter', sans-serif" fill="${textColor}" opacity="${earned ? 1 : 0.4}" letter-spacing="-1">${award.symbolText}</text>`;

  // Outer metallic ring (tier color)
  const outerRing = `<path d="${shapePath}" fill="none" stroke="${tierColor}" stroke-width="${s * 0.045}" opacity="${earned ? 0.85 : 0.3}"/>`;

  // Inner border
  const innerBorder = `<path d="${shapePath}" fill="none" stroke="rgba(255,255,255,${earned ? "0.25" : "0.08"})" stroke-width="${s * 0.015}"/>`;

  // Glow effect for earned badges
  const glowFilter = earned
    ? `
    <filter id="glow-${award.id}">
      <feGaussianBlur stdDeviation="${s * 0.04}" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>`
    : "";
  const glowAttr = earned ? `filter="url(#glow-${award.id})"` : "";

  // Animation for detail view
  const animStyle =
    animate && earned
      ? `
    <style>
      @keyframes badgeSpin-${award.id} {
        0%   { transform: rotateY(0deg); }
        15%  { transform: rotateY(40deg) scale(1.05); }
        30%  { transform: rotateY(0deg); }
        45%  { transform: rotateY(-30deg) scale(1.03); }
        60%  { transform: rotateY(0deg); }
        100% { transform: rotateY(0deg); }
      }
      .badge-spin-${award.id} {
        animation: badgeSpin-${award.id} 3s ease-in-out infinite;
        transform-origin: center;
        transform-style: preserve-3d;
      }
    </style>`
      : "";
  const wrapClass = animate && earned ? `badge-spin-${award.id}` : "";

  return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
    <defs>${glowFilter}${animStyle}</defs>
    <g class="${wrapClass}" opacity="${opacity}" ${glowAttr}>
      <path d="${shapePath}" fill="${fillColor}"/>
      ${innerBorder}
      ${outerRing}
      ${glossy}
      ${symbolEl}
    </g>
  </svg>`;
}

export function AwardsPage() {
  const navigate = useNavigate();
  
  const { data: metrics = [] } = useQuery({ queryKey: ["dailyMetrics"], queryFn: () => reportService.getDailyMetrics() });
  const { data: dbUserStreak } = useQuery({ queryKey: ["userStreak"], queryFn: () => import('@/features/awards/services/awardService').then(m => m.awardService.getUserStreak()) });
  const { data: dbUserAwards = [] } = useQuery({ queryKey: ["userAwards"], queryFn: () => import('@/features/awards/services/awardService').then(m => m.awardService.getUserAwards()) });

  const currentStreak = dbUserStreak?.current_streak ?? calculateCurrentDailyStreak(metrics);
  const bestStreak = dbUserStreak?.highest_streak ?? calculateBestDailyStreak(metrics);

  const earnedAwards = calculateEarnedAwards(metrics).map(award => {
    const dbAward = dbUserAwards.find(a => a.award_id === award.id);
    return {
      ...award,
      earned: !!dbAward || award.earned,
      earnedDate: dbAward?.unlocked_at || award.earnedDate
    };
  });

  const selectedAward = useAwardStore(s => s.selectedAward);
  const setSelectedAward = useAwardStore(s => s.setSelectedAward);

  const dailyAwards = earnedAwards.filter((a) => a.category === "daily");
  const earnedCount = dailyAwards.filter((a) => a.earned).length;
  const totalCount = dailyAwards.length;

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
          Awards Hall
        </h1>
        <div
          style={{
            background: "rgba(212,255,0,0.15)",
            color: "#D4FF00",
            padding: "4px 10px",
            borderRadius: "100px",
            fontSize: "11px",
            fontWeight: 700,
          }}
        >
          {earnedCount} / {totalCount}
        </div>
      </div>

      {/* Streaks Summary */}
      {todayMet && (
        <div style={{ padding: '0 20px', marginBottom: '16px', textAlign: 'center' }}>
           <div style={{ display: 'inline-block', background: 'rgba(212,255,0,0.1)', border: '1px solid rgba(212,255,0,0.2)', padding: '6px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, color: '#D4FF00' }}>
             ⏳ Today's streak is in progress. It will be finalized at the end of the day.
           </div>
        </div>
      )}
      <div className="streaks-bar glass-card">
        <div className="text-center py-[14px]">
          <div
            style={{
              fontSize: "var(--font-stat)",
              color: "#D4FF00",
              fontWeight: 700,
            }}
          >
            {currentStreak}
          </div>
          <div
            style={{
              fontSize: "var(--font-xs)",
              color: "rgba(235,235,245,0.5)",
              textTransform: "uppercase",
              fontWeight: 600,
              marginTop: "4px",
            }}
          >
            Current Streak
          </div>
        </div>
        <div
          className="text-center py-[14px]"
          style={{ borderLeft: "1px solid rgba(255,255,255,0.1)" }}
        >
          <div
            style={{
              fontSize: "var(--font-stat)",
              color: "#FF4D1C",
              fontWeight: 700,
            }}
          >
            {bestStreak}
          </div>
          <div
            style={{
              fontSize: "var(--font-xs)",
              color: "rgba(235,235,245,0.5)",
              textTransform: "uppercase",
              fontWeight: 600,
              marginTop: "4px",
            }}
          >
            Highest Streak
          </div>
        </div>
      </div>

      {/* Daily Streak Awards */}
      <div className="mt-[32px] px-[20px] mb-[12px]">
        <h2
          style={{
            fontSize: "var(--font-xl)",
            fontWeight: 700,
            color: "white",
            margin: 0,
          }}
        >
          🔥 Daily Streak Awards
        </h2>
        <div
          style={{
            fontSize: "14px",
            color: "rgba(235,235,245,0.5)",
            marginTop: "4px",
          }}
        >
          Hit your calorie and protein targets consistently
        </div>
      </div>

      <div className="awards-grid">
        {dailyAwards.map((award) => (
          <div
            key={award.id}
            className="award-cell"
            onClick={() => setSelectedAward(award)}
          >
            <div
              dangerouslySetInnerHTML={{
                __html: renderBadge(award, 72, award.earned, false),
              }}
            />
            <div
              style={{
                fontSize: "var(--font-xs)",
                fontWeight: 600,
                color: award.earned ? "white" : "rgba(235,235,245,0.5)",
                textAlign: "center",
                lineHeight: 1.2,
                marginTop: "4px",
              }}
            >
              {award.name}
            </div>
            <div
              style={{
                fontSize: "var(--font-xs)",
                color: "rgba(235,235,245,0.4)",
                textTransform: "capitalize",
                textAlign: "center",
              }}
            >
              {award.tier}
            </div>
            {!award.earned && (
              <i
                className="ti ti-lock"
                style={{
                  fontSize: "12px",
                  color: "rgba(235,235,245,0.35)",
                  marginTop: "2px",
                }}
              ></i>
            )}
          </div>
        ))}
      </div>

      <div style={{ height: "40px" }}></div>

      {/* Overlay */}
      {selectedAward && (
        <div className="award-overlay" onClick={() => setSelectedAward(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              dangerouslySetInnerHTML={{
                __html: renderBadge(
                  selectedAward,
                  160,
                  selectedAward.earned,
                  true,
                ),
              }}
            />
            <div
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: "white",
                textAlign: "center",
                marginTop: "20px",
              }}
            >
              {selectedAward.name}
            </div>
            <div
              style={{
                fontSize: "15px",
                fontWeight: 400,
                color: "rgba(235,235,245,0.65)",
                textAlign: "center",
                maxWidth: "280px",
                marginTop: "8px",
              }}
            >
              {selectedAward.description}
            </div>

            <div
              style={{
                marginTop: "24px",
                width: "100%",
                maxWidth: "280px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {selectedAward.earned ? (
                <div
                  style={{
                    background: "rgba(212,255,0,0.15)",
                    color: "#D4FF00",
                    padding: "6px 16px",
                    borderRadius: "100px",
                    fontSize: "var(--font-sm)",
                    fontWeight: 600,
                  }}
                >
                  ✓ Earned
                </div>
              ) : (
                <>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "rgba(235,235,245,0.5)",
                      marginBottom: "8px",
                    }}
                  >
                    Reach a {selectedAward.streakRequired}-day streak to unlock
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "6px",
                      background: "rgba(255,255,255,0.1)",
                      borderRadius: "3px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        background:
                          selectedAward.primaryColor || "#D4FF00",
                        width: `${Math.min(100, ((currentStreak) / selectedAward.streakRequired) * 100)}%`,
                      }}
                    ></div>
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "rgba(235,235,245,0.4)",
                      marginTop: "8px",
                      fontWeight: 500,
                    }}
                  >
                    {currentStreak}{" "}
                    / {selectedAward.streakRequired} days
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setSelectedAward(null)}
              style={{
                marginTop: "40px",
                background: "rgba(255,255,255,0.1)",
                color: "white",
                border: "none",
                padding: "12px 32px",
                borderRadius: "100px",
                fontSize: "15px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
