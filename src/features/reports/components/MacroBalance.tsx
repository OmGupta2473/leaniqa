import { motion } from 'motion/react';
import type { DbWeeklyReport } from '@/shared/types/supabase';
import { deriveMacroBalance } from '../utils/weeklyInsights';
interface MacroBalanceProps {
  report: DbWeeklyReport;
}

const COLORS = {
  protein: '#378ADD',
  carbs: '#D4FF00',
  fat: '#FFFFFF',
} as const;

function StackedBar({
  proteinPct,
  carbsPct,
  fatPct,
}: {
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
}) {
  return (
    <div className="flex h-3 w-full rounded-full overflow-hidden bg-[rgba(255,255,255,0.03)]">
      <motion.div
        initial={{ flexBasis: 0 }}
        animate={{ flexBasis: `${proteinPct}%` }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ backgroundColor: COLORS.protein }}
      />
      <motion.div
        initial={{ flexBasis: 0 }}
        animate={{ flexBasis: `${carbsPct}%` }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        style={{ backgroundColor: COLORS.carbs }}
      />
      <motion.div
        initial={{ flexBasis: 0 }}
        animate={{ flexBasis: `${fatPct}%` }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        style={{ backgroundColor: COLORS.fat }}
      />
    </div>
  );
}

export function MacroBalance({ report }: MacroBalanceProps) {
  const balance = deriveMacroBalance(report);

  if (
    balance.proteinPct === 0 &&
    balance.carbsPct === 0 &&
    balance.fatPct === 0
  ) {
    return null;
  }

  const rows = [
    { key: 'protein' as const, label: 'Protein', current: balance.proteinPct, target: balance.targetProteinPct },
    { key: 'carbs' as const, label: 'Carbs', current: balance.carbsPct, target: balance.targetCarbsPct },
    { key: 'fat' as const, label: 'Fat', current: balance.fatPct, target: balance.targetFatPct },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
      className="mt-6"
    >
      <h3 className="text-[12px] font-semibold uppercase tracking-widest text-zinc-500 mb-3 px-1">
        Macro balance
      </h3>
      <div className="glass-card-report p-5">
        <p className="text-[12px] text-zinc-500 mb-5 leading-snug">
          Share of calories from protein · carbs · fat
        </p>

        <div className="space-y-4 mb-5">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Your week
              </span>
              <span className="text-[11px] text-zinc-400 tabular-nums">
                {balance.proteinPct}% · {balance.carbsPct}% · {balance.fatPct}%
              </span>
            </div>
            <StackedBar
              proteinPct={balance.proteinPct}
              carbsPct={balance.carbsPct}
              fatPct={balance.fatPct}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Target
              </span>
              <span className="text-[11px] text-zinc-400 tabular-nums">
                {balance.targetProteinPct}% · {balance.targetCarbsPct}% · {balance.targetFatPct}%
              </span>
            </div>
            <StackedBar
              proteinPct={balance.targetProteinPct}
              carbsPct={balance.targetCarbsPct}
              fatPct={balance.targetFatPct}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-[rgba(255,255,255,0.06)] grid grid-cols-3 gap-3">
          {rows.map((row) => {
            const isGap = balance.biggestGapKey === row.key;
            return (
              <div
                key={row.key}
                className="flex flex-col items-center gap-1 rounded-[12px] py-2"
                style={
                  isGap
                    ? { border: '1px solid rgba(212,255,0,0.3)', background: 'rgba(212,255,0,0.03)' }
                    : undefined
                }
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: COLORS[row.key] }}
                  />
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    {row.label}
                  </span>
                </div>
                <div className="text-[14px] font-bold text-white tabular-nums">
                  {row.current}
                  <span className="text-[11px] text-zinc-500 font-medium"> / {row.target}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}