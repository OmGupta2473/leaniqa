import { Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import type { DbWeeklyReport } from '@/shared/types/supabase';
import { deriveCoachSummary } from '../utils/weeklyPresentation';

interface CoachSummaryCardProps {
  report: DbWeeklyReport;
}

export function CoachSummaryCard({ report }: CoachSummaryCardProps) {
  const summary = deriveCoachSummary(report);
  if (report.days_with_meals === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
      className="glass-card-report mt-6 p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={14} className="text-[#D4FF00]" />
        <h3 className="text-[12px] font-semibold uppercase tracking-widest text-zinc-500">
          Coach summary
        </h3>
      </div>

      <p className="text-[15px] text-zinc-200 leading-relaxed">
        {summary}
      </p>
    </motion.section>
  );
}