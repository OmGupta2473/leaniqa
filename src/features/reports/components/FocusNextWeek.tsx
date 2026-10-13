import { motion } from 'motion/react';
import type { DbWeeklyReport } from '@/shared/types/supabase';
import { deriveNextActions } from '../utils/weeklyInsights';
interface FocusNextWeekProps {
  report: DbWeeklyReport;
}

function deriveHeadline(report: DbWeeklyReport): string {
  const proteinThreshold = report.target_protein_g * 0.9;
  const proteinHits = report.day_summaries.filter(
    (d) => d.logged && d.proteinG >= proteinThreshold,
  ).length;
  const overDays = report.day_summaries.filter((d) => d.status === 'over').length;
  const underDays = report.day_summaries.filter((d) => d.status === 'under').length;

  if (report.days_with_meals < 5) return 'Log more consistently';
  if (proteinHits < Math.ceil(report.days_with_meals * 0.7)) return 'Protect your protein';
  if (overDays >= 2) return 'Eat closer to your target';
  if (underDays >= 2) return 'Eat closer to your target';
  return 'Keep the momentum';
}

export function FocusNextWeek({ report }: FocusNextWeekProps) {
  const actions = deriveNextActions(report);
  if (actions.length === 0) return null;

  const headline = deriveHeadline(report);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
      className="mt-6"
    >
      <h3 className="text-[12px] font-semibold uppercase tracking-widest text-[#D4FF00] mb-3 px-1">
        Focus for next week
      </h3>
      <div className="rounded-[24px] border border-[#D4FF00]/30 bg-[#D4FF00]/[0.04] backdrop-blur-md p-5 shadow-[0_8px_32px_rgba(212,255,0,0.08)]">
        <h4 className="text-[18px] font-semibold text-white tracking-tight mb-4">
          {headline}
        </h4>
        <ol className="space-y-3">
          {actions.map((action, index) => (
            <li key={action.id} className="flex gap-3">
              <span className="w-7 h-7 rounded-full bg-[#D4FF00] text-black text-[13px] font-bold flex items-center justify-center shrink-0">
                {index + 1}
              </span>
              <span className="text-[14px] text-zinc-200 leading-snug pt-1">
                {action.text}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </motion.section>
  );
}