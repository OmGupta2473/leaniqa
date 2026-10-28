import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Sparkles, ChevronRight } from 'lucide-react';
import {
  AWARD_BY_ID,
  nextClosestAward,
  type AwardEvaluation,
} from '@/shared/utils/awardsEngine';
import { getAwardDistanceCopy } from '../utils/awardDistance';
import { AwardMedal } from './AwardMedal';
import { type AwardCategory } from '../theme';

interface NextMilestoneHeroProps {
  evaluation: AwardEvaluation;
}

/**
 * Shows the closest locked award and its progress.
 * Compacted for the side-by-side mobile layout.
 */
export function NextMilestoneHero({ evaluation }: NextMilestoneHeroProps) {
  const primary = useMemo(() => {
    const closest = nextClosestAward(evaluation);
    return closest ?? evaluation.progress.find((p) => p.id === 'streak_1') ?? null;
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
      className="relative h-full overflow-hidden rounded-[24px] border border-[rgba(255,255,255,0.06)] flex flex-col justify-between"
      style={{
        background: `radial-gradient(120% 100% at 50% 0%, ${definition.primaryColor}12 0%, rgba(10,10,12,0.98) 55%)`,
      }}
      aria-label="Next milestone"
    >
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full blur-[80px]"
        style={{ background: definition.primaryColor, opacity: 0.14 }}
      />

      <div className="relative flex flex-col items-center px-4 pt-4 pb-4 text-center">
        <div className="flex items-center justify-between mb-4 w-full">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#D4FF00]" />
            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-500">Next Milestone</span>
          </div>
          <ChevronRight size={16} className="text-zinc-500" />
        </div>

        <div className="flex justify-center mb-4 w-full">
          <AwardMedal
            category={definition.category as AwardCategory}
            symbol={definition.symbol}
            current={primary.current}
            target={primary.target}
            unlocked={false}
            size={80}
          />
        </div>

        <h3 className="text-[13px] font-bold tracking-tight text-white text-center mb-3">
          {definition.name}
        </h3>

        <div className="flex items-center justify-center gap-2 mb-4">
          <span
            className="rounded-full px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
            style={{
              border: `1px solid ${definition.primaryColor}55`,
              color: definition.primaryColor,
            }}
          >
            {definition.category}
          </span>
          <span className="rounded-full px-2.5 py-0.5 text-[9px] font-semibold text-zinc-300 border border-[rgba(255,255,255,0.08)]">
            {definition.target} {definition.unitLabel}
          </span>
        </div>

        <div className="w-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Progress</span>
            <span className="text-[11px] font-semibold text-white tabular-nums">
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
          <p className="text-center text-[10px] text-zinc-400 mt-2">
            {getAwardDistanceCopy(definition.category, primary.current, primary.target)}
          </p>
        </div>
      </div>
    </motion.section>
  );
}