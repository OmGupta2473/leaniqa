import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import type { DbWeeklyReport } from '@/shared/types/supabase';
import { mealService } from '@/features/nutrition/services/mealService';

interface DayDetailPanelProps {
  report: DbWeeklyReport;
  selectedDate: string;
  onClose: () => void;
}

function formatDayHeading(dateStr: string): string {
  const parts = dateStr.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  const dayName = dayNames[date.getUTCDay()];
  return `${dayName}, ${months[parts[1] - 1]} ${parts[2]}`;
}

function scoreColor(score: number): string {
  if (score >= 80) return '#D4FF00';
  if (score >= 60) return '#fbbf24';
  return '#FF4D1C';
}

export function DayDetailPanel({ report, selectedDate, onClose }: DayDetailPanelProps) {
  const day = report.day_summaries.find((d) => d.date === selectedDate);

  const { data: meals = [], isLoading } = useQuery({
    queryKey: ['meals', 'report', selectedDate],
    queryFn: () => mealService.getMealsByDate(selectedDate),
    enabled: !!day && day.logged,
  });

  if (!day) return null;

  const kcalGap = day.calories - report.target_calories;
  const proteinGap = day.proteinG - report.target_protein_g;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: 12, height: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card-report mt-4 p-5 overflow-hidden"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-1">
            Day detail
          </div>
          <h3 className="text-[18px] font-semibold text-white tracking-tight">
            {formatDayHeading(day.date)}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close day detail"
          className="w-9 h-9 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-zinc-400 transition-colors hover:bg-[rgba(255,255,255,0.1)] hover:text-white"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <span
          className="px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide"
          style={{
            color: scoreColor(day.score),
            backgroundColor: `${scoreColor(day.score)}1A`,
          }}
        >
          Score {day.score}
        </span>
        <span
          className="px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide"
          style={{
            color: kcalGap < 0 ? '#FF4D1C' : '#D4FF00',
            backgroundColor: kcalGap < 0 ? 'rgba(255,77,28,0.1)' : 'rgba(212,255,0,0.1)',
          }}
        >
          {kcalGap > 0 ? '+' : ''}
          {Math.round(kcalGap)} kcal
        </span>
        <span
          className="px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide"
          style={{
            color: proteinGap < 0 ? '#FF4D1C' : '#D4FF00',
            backgroundColor: proteinGap < 0 ? 'rgba(255,77,28,0.1)' : 'rgba(212,255,0,0.1)',
          }}
        >
          {proteinGap > 0 ? '+' : ''}
          {Math.round(proteinGap)} g protein
        </span>
      </div>

      {!day.logged ? (
        <p className="text-[14px] text-zinc-500 text-center py-4">
          No meals logged this day.
        </p>
      ) : isLoading ? (
        <p className="text-[13px] text-zinc-500 text-center py-4">
          Loading meals…
        </p>
      ) : meals.length === 0 ? (
        <p className="text-[14px] text-zinc-500 text-center py-4">
          No meals logged this day.
        </p>
      ) : (
        <ul className="space-y-2">
          {meals.map((m) => (
            <li
              key={m.id ?? `${m.meal_text}-${m.meal_time}`}
              className="flex items-center justify-between gap-3 rounded-[14px] bg-[rgba(255,255,255,0.02)] px-3 py-2.5"
            >
              <span className="text-[13px] text-white font-medium truncate flex-1 min-w-0">
                {m.meal_text}
              </span>
              <span className="text-[11px] font-bold text-[#FF4D1C] bg-[rgba(255,77,28,0.1)] px-2 py-0.5 rounded-full shrink-0 tabular-nums">
                {m.calories} kcal
              </span>
              <span className="text-[11px] font-bold text-[#D4FF00] bg-[rgba(212,255,0,0.1)] px-2 py-0.5 rounded-full shrink-0 tabular-nums">
                {m.protein}g
              </span>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}