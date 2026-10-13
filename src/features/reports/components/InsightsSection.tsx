import { TrendingUp, AlertTriangle, Info, Calendar, Flame } from 'lucide-react';
import { motion } from 'motion/react';
import type { DbWeeklyReport } from '@/shared/types/supabase';
import { deriveInsights, derivePatterns, type Insight } from '../utils/weeklyInsights';

interface InsightsSectionProps {
  report: DbWeeklyReport;
}

function iconForInsight(kind: Insight['kind']) {
  if (kind === 'positive') return TrendingUp;
  if (kind === 'warning') return AlertTriangle;
  return Info;
}

function colorForInsight(kind: Insight['kind']): string {
  if (kind === 'positive') return '#D4FF00';
  if (kind === 'warning') return '#fbbf24';
  return '#378ADD';
}

export function InsightsSection({ report }: InsightsSectionProps) {
  const insights = deriveInsights(report);
  const patterns = derivePatterns(report);

  if (insights.length === 0 && patterns.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
      className="mt-6"
    >
      {insights.length > 0 && (
        <div className="mb-6">
          <h3 className="text-[12px] font-semibold uppercase tracking-widest text-zinc-500 mb-3 px-1">
            This week in review
          </h3>
          <div className="glass-card-report overflow-hidden divide-y divide-[rgba(255,255,255,0.05)]">
            {insights.map((insight) => {
              const Icon = iconForInsight(insight.kind);
              const color = colorForInsight(insight.kind);
              return (
                <div key={insight.id} className="flex gap-3 p-4">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: `${color}14` }}
                  >
                    <Icon size={16} style={{ color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold text-white leading-tight mb-1">
                      {insight.title}
                    </div>
                    <div className="text-[13px] text-zinc-400 leading-snug">
                      {insight.body}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {patterns.length > 0 && (
        <div>
          <h3 className="text-[12px] font-semibold uppercase tracking-widest text-zinc-500 mb-3 px-1">
            Patterns
          </h3>
          <div className="glass-card-report overflow-hidden divide-y divide-[rgba(255,255,255,0.05)]">
            {patterns.map((pattern) => {
              const Icon = pattern.id === 'weekend_weekday' ? Calendar : Flame;
              return (
                <div key={pattern.id} className="flex gap-3 p-4">
                  <div className="w-9 h-9 rounded-full bg-[rgba(55,138,221,0.08)] flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-[#378ADD]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold text-white leading-tight mb-1">
                      {pattern.title}
                    </div>
                    <div className="text-[13px] text-zinc-400 leading-snug">
                      {pattern.body}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.section>
  );
}