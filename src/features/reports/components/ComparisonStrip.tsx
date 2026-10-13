import { ArrowDown, ArrowUp, Flame, Beef, Wheat, Droplet } from 'lucide-react';
import { motion } from 'motion/react';
import type { DbWeeklyReport } from '@/shared/types/supabase';
import type { MetricComparison, MetricKey } from '../utils/weekComparison';
import { buildComparisons, colorForTrend } from '../utils/weekComparison';

interface ComparisonStripProps {
  current: DbWeeklyReport;
  previous: DbWeeklyReport | null;
}

const ICONS: Record<MetricKey, typeof Flame> = {
  calories: Flame,
  protein: Beef,
  carbs: Wheat,
  fat: Droplet,
};

function formatValue(value: number, unit: string): string {
  if (unit === 'kcal') return Math.round(value).toLocaleString();
  return String(Math.round(value));
}

function trendLabel(trend: MetricComparison['trend']): string {
  switch (trend) {
    case 'toward': return 'Closer to target';
    case 'away': return 'Further from target';
    case 'neutral': return 'Holding steady';
    case 'unavailable': return 'No prior week to compare';
    case 'limited': return 'Limited data';
  }
}

function MetricCard({ metric }: { metric: MetricComparison }) {
  const Icon = ICONS[metric.key];
  const fillPct = metric.currentTarget > 0
    ? Math.min(1, metric.current / metric.currentTarget) * 100
    : 0;

  const hasPrevious = metric.previous !== null && metric.deltaVsPrevious !== null;
  const deltaPositive = hasPrevious && metric.deltaVsPrevious! > 0;
  const trendColor = colorForTrend(metric.trend);

  return (
    <div className="glass-card-report p-4 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ background: `${metric.accent}14` }}
        >
          <Icon size={16} style={{ color: metric.accent }} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          {metric.label}
        </span>
      </div>

      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-[26px] font-bold text-white tabular-nums tracking-tight">
          {formatValue(metric.current, metric.unit)}
        </span>
        <span className="text-[12px] text-zinc-500 font-medium">{metric.unit}</span>
      </div>

      <div className="text-[12px] text-zinc-500 mb-3 tabular-nums">
        Target {formatValue(metric.currentTarget, metric.unit)} {metric.unit}
      </div>

      <div className="h-[3px] rounded-full bg-[rgba(255,255,255,0.05)] overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${fillPct}%`, backgroundColor: metric.accent }}
        />
      </div>

      <div className="mt-auto flex flex-col gap-1">
        {hasPrevious ? (
          <div className="flex items-center gap-1 text-[12px] tabular-nums">
            {deltaPositive ? (
              <ArrowUp size={12} className="text-white" />
            ) : (
              <ArrowDown size={12} className="text-white" />
            )}
            <span className="text-white font-semibold">
              {deltaPositive ? '+' : ''}
              {Math.round(metric.deltaVsPrevious!)}
            </span>
            <span className="text-zinc-500">{metric.unit} vs last week</span>
          </div>
        ) : (
          <div className="text-[12px] text-zinc-600">—</div>
        )}

        <div
          className="text-[11px] font-medium"
          style={{ color: trendColor }}
        >
          {trendLabel(metric.trend)}
        </div>
      </div>
    </div>
  );
}

export function ComparisonStrip({ current, previous }: ComparisonStripProps) {
  const metrics = buildComparisons(current, previous);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className="mt-4"
    >
      <h3 className="text-[12px] font-semibold uppercase tracking-widest text-zinc-500 mb-3 px-1">
        Averages vs last week
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m, i) => (
          <motion.div
            key={m.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 26,
              delay: 0.3 + i * 0.05,
            }}
            whileHover={{ y: -3 }}
          >
            <MetricCard metric={m} />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}