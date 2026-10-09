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

      <div className="relative flex flex-col items-center px-3 md:px-4 pt-4 pb-3 text-center">
        <div className="flex items-center justify-between mb-3 w-full">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#D4FF00]" />
            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Next Milestone</span>
          </div>
          <ChevronRight size={18} className="text-zinc-500" />
        </div>

        <div className="flex justify-center mb-4 w-full">
          <AwardMedal
            category={definition.category as AwardCategory}
            symbol={definition.symbol}
            current={primary.current}
            target={primary.target}
            unlocked={false}
            size={72}
          />
        </div>

        <h3 className="text-[13px] md:text-[15px] font-bold tracking-tight text-white text-center mb-3">
          {definition.name}
        </h3>

        <div className="flex items-center justify-center gap-1.5 mb-4">
          <span
            className="rounded-full px-2 md:px-2.5 py-0.5 text-[9px] md:text-[10px] font-semibold uppercase tracking-wider"
            style={{
              border: `1px solid ${definition.primaryColor}55`,
              color: definition.primaryColor,
            }}
          >
            {definition.category}
          </span>
          <span className="rounded-full px-2 md:px-2.5 py-0.5 text-[9px] md:text-[10px] font-semibold text-zinc-300 border border-[rgba(255,255,255,0.08)]">
            {definition.target} {definition.unitLabel}
          </span>
        </div>

        <div className="mb-4 w-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-zinc-500">Progress</span>
            <span className="text-[10px] md:text-[11px] font-semibold text-white tabular-nums">
              {primary.current} / {primary.target}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
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
          <p className="text-center text-[10px] md:text-[11px] text-zinc-400 mt-2">
            {getAwardDistanceCopy(definition.category, primary.current, primary.target)}
          </p>
        </div>
      </div>

      {nextThree.length > 0 && (
        <>
          <div className="h-px bg-[rgba(255,255,255,0.06)] my-3 md:my-4" />

          <div>
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-zinc-500">Coming Up</span>
              <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-zinc-500" />
            </div>
            <div className="flex justify-around">
              {nextThree.map((p) => {
                const d = AWARD_BY_ID[p.id];
                if (!d) return null;
                return (
                  <div
                    key={p.id}
                    className="flex flex-col items-center gap-1 md:gap-1.5"
                    title={d.name}
                  >
                    <div
                      className="w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center text-[16px] md:text-[20px]"
                      style={{
                        background: `radial-gradient(circle at 30% 30%, ${d.primaryColor}22, ${d.primaryColor}06)`,
                        border: `1px solid ${d.primaryColor}30`,
                      }}
                    >
                      {d.symbol}
                    </div>
                    <span className="text-[10px] md:text-[11px] font-semibold text-zinc-400 tabular-nums">
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