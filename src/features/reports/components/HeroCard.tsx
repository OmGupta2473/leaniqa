import { motion } from 'motion/react';
import type { DbWeeklyReport } from '@/shared/types/supabase';
import { deriveHeroSummary, deriveHeroChips, daysCompletedInWeek, daysCompletedElapsed } from '../utils/weeklyPresentation';
import { AnimatedNumber } from './AnimatedNumber';

const RING_SIZE = 148;
const RING_STROKE = 12;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRC = 2 * Math.PI * RING_RADIUS;

interface HeroCardProps {
  report: DbWeeklyReport;
}

export function HeroCard({ report }: HeroCardProps) {
  const score = Math.max(0, Math.min(100, report.weekly_score));
  const offset = RING_CIRC - (score / 100) * RING_CIRC;

  const goalDays = report.day_summaries.filter((d) => d.status === 'on_target').length;

  const summary = deriveHeroSummary({
    daysWithMeals: report.days_with_meals,
    targetProteinG: report.target_protein_g,
    daySummaries: report.day_summaries,
  });

  return (
    <div className="glass-card-report p-6">
      <div className="flex items-center gap-6">
        <div
          className="relative shrink-0"
          style={{ width: RING_SIZE, height: RING_SIZE }}
        >
          <svg
            width={RING_SIZE}
            height={RING_SIZE}
            viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
            className="transform -rotate-90"
          >
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={RING_STROKE}
            />
            <motion.circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke="#D4FF00"
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={RING_CIRC}
              initial={{ strokeDashoffset: RING_CIRC }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[40px] font-bold text-white tracking-tighter leading-none tabular-nums">
              <AnimatedNumber value={score} />
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 mt-1.5 font-semibold">
              Score
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-[20px] font-semibold text-white tracking-tight mb-2">
            Weekly consistency
          </h2>
                    <p className="text-[15px] text-zinc-400 leading-snug mb-4">
            {summary}
          </p>

          <p className="text-[12px] text-zinc-500 tabular-nums mb-4">
            {daysCompletedElapsed(report) === 0 ? (
              <>No completed days yet this week</>
            ) : (
              <>
                {goalDays} goal {goalDays === 1 ? 'day' : 'days'} · {daysCompletedInWeek(report)}/{daysCompletedElapsed(report)} logged
              </>
            )}
          </p>

          <div className="flex flex-wrap gap-2">
            {deriveHeroChips(report).map((chip, i) => (
              <motion.div
                key={chip.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 28,
                  delay: 0.4 + i * 0.06,
                }}
                className="flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 backdrop-blur-sm"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: chip.accent }}
                />
                <span className="text-[13px] font-bold text-white tabular-nums">
                  {chip.value}
                </span>
                <span className="text-[12px] text-zinc-500">{chip.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}