import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
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
      className="relative mb-8 overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.06)]"
      style={{
        background: `radial-gradient(120% 100% at 50% 0%, ${definition.primaryColor}12 0%, rgba(10,10,12,0.98) 55%)`,
      }}
      aria-label="Next milestone"
    >
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full blur-[80px]"
        style={{ background: definition.primaryColor, opacity: 0.14 }}
      />

      <div className="relative flex flex-col items-center px-6 pt-8 pb-6 text-center">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#D4FF00] mb-6">
          <Sparkles className="h-3 w-3" />
          Next milestone
        </div>

        <div className="mb-4">
          <AwardMedal
            category={definition.category as AwardCategory}
            symbol={definition.symbol}
            current={primary.current}
            target={primary.target}
            unlocked={false}
            size={80}
          />
        </div>

        <h3 className="text-[22px] font-bold tracking-tight text-white mb-1">
          {definition.name}
        </h3>

        <div className="flex items-center gap-2 mb-5">
          <span
            className="rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{
              borderColor: `${definition.primaryColor}35`,
              color: definition.primaryColor,
            }}
          >
            {definition.category}
          </span>
          <span className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] px-2.5 py-0.5 text-[10px] font-medium text-zinc-400">
            {definition.target} {definition.unitLabel}
          </span>
        </div>

        <div className="w-full max-w-[280px]">
          <div className="mb-2 flex justify-between text-[11px] uppercase tracking-wider text-zinc-500">
            <span>Progress</span>
            <span className="tabular-nums">
              {primary.current} / {primary.target}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1], delay: 0.15 }}
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${definition.primaryColor}, ${definition.accentColor})`,
                boxShadow: `0 0 12px ${definition.primaryColor}60`,
              }}
            />
          </div>
        </div>

        <p className="mt-4 text-[14px] font-medium text-zinc-300">
          {getAwardDistanceCopy(
            definition.category,
            primary.current,
            primary.target,
          )}
        </p>
      </div>

      {nextThree.length > 0 && (
        <div className="border-t border-[rgba(255,255,255,0.05)] px-6 py-4">
          <div className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Coming up
          </div>
          <div className="flex justify-center gap-4">
            {nextThree.map((p) => {
              const d = AWARD_BY_ID[p.id];
              if (!d) return null;
              return (
                <div
                  key={p.id}
                  className="flex flex-col items-center gap-1"
                  title={d.name}
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-2xl text-[18px] opacity-70"
                    style={{
                      background: `linear-gradient(135deg, ${d.primaryColor}18, ${d.primaryColor}04)`,
                      border: `1px solid ${d.primaryColor}25`,
                    }}
                  >
                    {d.symbol}
                  </div>
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500 tabular-nums">
                    {Math.round(p.percentage)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.section>
  );
}