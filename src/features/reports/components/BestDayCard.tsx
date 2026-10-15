import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import type { DbWeeklyReport } from '@/shared/types/supabase';
import { deriveBestDay } from '../utils/weeklyInsights';

interface BestDayCardProps {
  report: DbWeeklyReport;
}

export function BestDayCard({ report }: BestDayCardProps) {
  const best = deriveBestDay(report);
  if (!best) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
      className="mt-6"
    >
      <h3 className="text-[12px] font-semibold uppercase tracking-widest text-[#D4FF00] mb-3 px-1">
        Your best day
      </h3>

      <div className="rounded-[24px] border border-[#D4FF00]/30 bg-[#D4FF00]/[0.04] backdrop-blur-md p-5 shadow-[0_8px_32px_rgba(212,255,0,0.08)]">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={14} className="text-[#D4FF00]" />
          <h4 className="text-[18px] font-semibold text-white tracking-tight">
            {best.headline}
          </h4>
        </div>

        <div className="grid grid-cols-3 gap-2.5 mb-5">
          <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] px-3 py-2.5 text-center">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
              Calories
            </div>
            <div className="text-[15px] font-semibold tabular-nums text-white leading-none">
              {best.calories}
            </div>
            <div className="text-[10px] text-zinc-500 tabular-nums mt-1">
              / {best.targetCalories}
            </div>
          </div>

          <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] px-3 py-2.5 text-center">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
              Protein
            </div>
            <div className="text-[15px] font-semibold tabular-nums text-[#378ADD] leading-none">
              {Math.round(best.proteinG)}g
            </div>
            <div className="text-[10px] text-zinc-500 tabular-nums mt-1">
              / {best.targetProteinG}g
            </div>
          </div>

          <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] px-3 py-2.5 text-center">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
              Carbs
            </div>
            <div className="text-[15px] font-semibold tabular-nums text-white leading-none">
              {Math.round(best.carbsG)}g
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">&nbsp;</div>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-[rgba(212,255,0,0.15)]">
          <div className="flex items-start gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4FF00] shrink-0 mt-1 w-[58px]">
              Worked
            </span>
            <span className="text-[13.5px] text-zinc-200 leading-snug flex-1">
              {best.whatWorked}
            </span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#378ADD] shrink-0 mt-1 w-[58px]">
              Repeat
            </span>
            <span className="text-[13.5px] text-zinc-200 leading-snug flex-1">
              {best.repeatIt}
            </span>
          </div>
        </div>
      </div>
    </motion.section>
  );
}