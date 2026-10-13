import { motion } from 'motion/react';
import type { WeeklyDaySummary } from '@/shared/types/supabase';
import { colorForDayBar } from '../utils/weeklyPresentation';
import { cn } from '@/shared/utils/utils';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface DayTimelineProps {
  days: WeeklyDaySummary[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
}

function dayNumber(dateStr: string): number {
  const parts = dateStr.split('-');
  return Number(parts[2]);
}

function fullDayName(dayOfWeek: number): string {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek] ?? '';
}

export function DayTimeline({ days, selectedDate, onSelectDate }: DayTimelineProps) {
  const maxCalories = Math.max(...days.map((d) => d.calories), 1);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
      className="glass-card-report mt-4 p-5"
    >
      <h3 className="text-[12px] font-semibold uppercase tracking-widest text-zinc-500 mb-4">
        Daily timeline
      </h3>

      <div className="grid grid-cols-7 gap-1.5 items-end" style={{ height: 96 }}>
        {days.map((d) => {
          const isSelected = selectedDate === d.date;
          const barHeightPct = d.logged
            ? Math.max(12, Math.min(100, (d.calories / maxCalories) * 100))
            : 4;
          const color = colorForDayBar(d.status);

          return (
            <motion.button
              key={d.date}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 24,
                delay: 0.25 + d.dayOfWeek * 0.035,
              }}
              whileTap={{ scale: 0.94 }}
              onClick={() => onSelectDate(isSelected ? null : d.date)}
              aria-label={`${fullDayName(d.dayOfWeek)}, ${d.calories} calories, ${d.status.replace('_', ' ')}`}
              className={cn(
                'flex flex-col items-center justify-end gap-1 rounded-md outline-none',
                'focus-visible:ring-2 focus-visible:ring-[#D4FF00]',
                'transition-[box-shadow] duration-200',
                isSelected && 'ring-2 ring-[#D4FF00] ring-offset-1 ring-offset-[#0A0A0A]',
              )}
              style={{ height: '100%' }}
            >
              <div className="flex-1 flex items-end w-full">
                <div
                  className="w-full rounded-md"
                  style={{
                    height: `${barHeightPct}%`,
                    minHeight: d.logged ? 6 : 3,
                    backgroundColor: color,
                  }}
                />
              </div>
              <span className="text-[11px] font-bold text-white leading-none">
                {DAY_LETTERS[d.dayOfWeek] ?? '?'}
              </span>
              <span className="text-[10px] text-zinc-500 leading-none tabular-nums">
                {dayNumber(d.date)}
              </span>
              {d.isToday && (
                <span className="text-[8px] font-bold uppercase tracking-wider text-[#D4FF00] leading-none">
                  Today
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.section>
  );
}