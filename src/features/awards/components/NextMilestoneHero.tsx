import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Sparkles, ChevronRight } from 'lucide-react';
import {
  AWARD_BY_ID,
  nextClosestAward,
  type AwardEvaluation,
  type AwardProgress,
} from '@/shared/utils/awardsEngine';
import { getAwardDistanceCopy } from '../utils/awardDistance';
import { AwardMedal } from './AwardMedal';
import { type AwardCategory } from '../theme';

interface NextMilestoneHeroProps {
  evaluation: AwardEvaluation;
}

/**
 * Shows the closest locked award, its progress, and a strip previewing
 * the next three locked awards. Falls back to streak_1 for new users
 * with zero progress on anything.
 */
export function NextMilestoneHero({ evaluation }: NextMilestoneHeroProps) {
  const { primary, nextThree } = useMemo(() => {
    const closest = nextClosestAward(evaluation);
    const fallback = evaluation.progress.find((p) => p.id === 'streak_1') ?? null;
    const primaryProgress: AwardProgress | null = closest ?? fallback;

    const nextThreeProgress = evaluation.progress
      .filter((p) => !p.eligible && !p.unlocked && p.id !== primaryProgress?.id)
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3);

    return { primary: primaryProgress, nextThree: nextThreeProgress };
  }, [evaluation]);

  if (!primary) return null;
  const definition = AWARD_BY_ID[primary.id];
  if (!definition) return null;

  const progressPct = primary.target > 0
    ? Math.min(100, Math.round((primary.current / primary.target) * 100))
    : 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="relative h-full overflow-hidden rounded-[22px] border border-[rgba(255,255,255,0.06)]"
      style={{
        background: `radial-gradient(120% 100% at 50% 0%, ${definition.primaryColor}12 0%, rgba(10,10,12,0.98) 55%)`,
      }}
      aria-label="Next milestone"
    >
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full blur-[80px]"
        style={{ background: definition.primaryColor, opacity: 0.14 }}
      />

      <div className="relative flex flex-col items-center px-3 md:px-4 pt-4 md:pt-5 pb-3 md:pb-4 text-center">
        <div className="flex items-center justify-between mb-5 w-full">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-[#D4FF00]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">Next Milestone</span>
          </div>
          <ChevronRight size={18} className="text-zinc-500" />
        </div>

        <div className="flex justify-center mb-4 w-full">
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
              {/* track */}
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              {/* progress — reuse definition.primaryColor */}
              <circle cx="50" cy="50" r="42" fill="none" stroke={definition.primaryColor} strokeWidth="6" strokeLinecap="round" strokeDasharray={2 * Math.PI * 42} strokeDashoffset={(2 * Math.PI * 42) * (1 - progressPct / 100)} style={{ transition: 'stroke-dashoffset 800ms ease' }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <AwardMedal
                category={definition.category as AwardCategory}
                symbol={definition.symbol}
                current={primary.current}
                target={primary.target}
                unlocked={false}
                size={56}
              />
            </div>
          </div>
        </div>

        <h3 className="text-[22px] font-bold tracking-tight text-white text-center mb-4">
          {definition.name}
        </h3>

        <div className="flex items-center justify-center gap-2 mb-6">
          <span
            className="rounded-full px-4 py-1.5 text-[12px] font-semibold uppercase tracking-wider"
            style={{
              border: `1px solid ${definition.primaryColor}55`,
              color: definition.primaryColor,
            }}
          >
            {definition.category}
          </span>
          <span className="rounded-full px-4 py-1.5 text-[12px] font-semibold text-zinc-300 border border-[rgba(255,255,255,0.08)]">
            {definition.target} {definition.unitLabel}
          </span>
        </div>

        <div className="mb-4 w-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Progress</span>
            <span className="text-[13px] font-semibold text-white tabular-nums">
              {primary.current} / {primary.target}
            </span>
          </div>
          <div className="h-2 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${progressPct}%`,
                background: `linear-gradient(90deg, ${definition.primaryColor}, ${definition.accentColor})`,
                boxShadow: `0 0 12px ${definition.primaryColor}60`,
                transition: 'width 800ms ease',
              }}
            />
          </div>
          <p className="text-center text-[13px] text-zinc-400 mt-3">
            {getAwardDistanceCopy(definition.category, primary.current, primary.target)}
          </p>
        </div>
      </div>

      {nextThree.length > 0 && (
        <>
          <div className="h-px bg-[rgba(255,255,255,0.06)] my-5" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Coming Up</span>
              <ChevronRight size={16} className="text-zinc-500" />
            </div>
            <div className="flex justify-around">
              {nextThree.map((p) => {
                const d = AWARD_BY_ID[p.id];
                if (!d) return null;
                return (
                  <div
                    key={p.id}
                    className="flex flex-col items-center gap-2"
                    title={d.name}
                  >
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-[26px]"
                      style={{
                        background: `radial-gradient(circle at 30% 30%, ${d.primaryColor}22, ${d.primaryColor}06)`,
                        border: `1px solid ${d.primaryColor}30`,
                      }}
                    >
                      {d.symbol}
                    </div>
                    <span className="text-[13px] font-semibold text-zinc-400 tabular-nums">
                      {Math.round(p.percentage)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </motion.section>
  );
}