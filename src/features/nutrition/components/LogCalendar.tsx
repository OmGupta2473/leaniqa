import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { BottomSheet } from '@/shared/components/BottomSheet';
import { MicroRing } from '@/features/reports/components/MicroRing';
import { classifyDay, colorForDayStatus, type MetricStatus, type GoalType } from '@/shared/utils/dayStatus';
import { getKolkataDateString, shiftKolkataDateString } from '@/shared/utils/timezone';
import { cn } from '@/shared/utils/utils';
import { motion } from 'motion/react';
import { DbDailyMetric } from '@/shared/types/supabase';

interface LogCalendarProps {
  isOpen: boolean;
  onClose: () => void;
  historyDays: number | null;
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  goalType: GoalType;
  todayStatus?: MetricStatus | null;
  /** Legacy prop passed by MealLoggerPage; unused internally. */
  floorDate?: string;
  metrics: Array<{
    date: string;
    actual_calories: number;
    target_calories: number;
    actual_protein: number;
    target_protein: number;
    user_id: string;
    score: number;
  }>;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function getDayOfWeek(date: Date): number {
  return date.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function dateToStr(date: Date): string {
  return getKolkataDateString(date);
}

function isSameDay(a: string, b: string): boolean {
  return a === b;
}

function isBefore(a: string, b: string): boolean {
  return a < b;
}

function isAfter(a: string, b: string): boolean {
  return a > b;
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function getMonthGrid(monthStart: Date): Date[] {
  const firstDay = startOfMonth(monthStart);
  const lastDay = endOfMonth(monthStart);
  const firstDayOfWeek = (getDayOfWeek(firstDay) + 6) % 7;
  
  const days: Date[] = [];
  
  for (let i = firstDayOfWeek; i >= 1; i--) {
    days.push(addDays(firstDay, -i));
  }
  
  const daysInMonth = lastDay.getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(firstDay.getFullYear(), firstDay.getMonth(), d));
  }
  
  while (days.length < 42) {
    days.push(addDays(days[days.length - 1], 1));
  }
  
  return days;
}

function formatDateHeading(dateStr: string): string {
  const parts = dateStr.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parts[1] - 1]} ${parts[2]}, ${parts[0]}`;
}

export function LogCalendar({
  isOpen,
  onClose,
  historyDays,
  selectedDate,
  onSelectDate,
  goalType,
  todayStatus,
  metrics,
}: LogCalendarProps) {
  if (typeof document === 'undefined') return null;

  const navigate = useNavigate();
  const today = getKolkataDateString();
  const [viewMonth, setViewMonth] = useState<Date>(startOfMonth(new Date()));
  const [upgradeTeaserDate, setUpgradeTeaserDate] = useState<string | null>(null);

  const metricsMap = new Map<string, DbDailyMetric>();
  for (const m of metrics) {
    metricsMap.set(m.date, m);
  }

  // Rolling lock window based on TODAY.
  // historyDays = 14 => threshold is today - 13 (14 days total including today).
  // Anything before the threshold is locked.
  const lockThreshold = historyDays === null ? null : shiftKolkataDateString(today, -(Math.max(historyDays, 1) - 1));

  const goPrevMonth = () => {
    setViewMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };

  const goNextMonth = () => {
    setViewMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  // Users on ANY plan can navigate back through ALL past months freely.
  const canGoPrev = true;
  const canGoNext = !isSameMonth(viewMonth, startOfMonth(new Date()));

  const handleDayClick = (dateStr: string) => {
    if (isAfter(dateStr, today)) return;

    if (lockThreshold && isBefore(dateStr, lockThreshold)) {
      setUpgradeTeaserDate(dateStr);
      return;
    }

    onSelectDate(dateStr);
    onClose();
  };

  const gridDays = getMonthGrid(viewMonth);

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        maxHeight="auto"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <button
              onClick={goPrevMonth}
              disabled={!canGoPrev}
              aria-label="Previous month"
              className="w-11 h-11 rounded-full flex items-center justify-center bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-zinc-300 transition-colors hover:bg-[rgba(255,255,255,0.08)] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
            </button>
            <h3 className="text-[22px] font-semibold text-white tracking-tight">
              {formatMonthYear(viewMonth)}
            </h3>
            <button
              onClick={goNextMonth}
              disabled={!canGoNext}
              aria-label="Next month"
              className="w-11 h-11 rounded-full flex items-center justify-center bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-zinc-300 transition-colors hover:bg-[rgba(255,255,255,0.08)] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 px-4 pb-3 text-center text-[11px] font-medium text-zinc-500 uppercase tracking-[0.08em]">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="flex-1 overflow-y-auto px-4 pb-6">
            <div className="grid grid-cols-7 gap-1">
              {gridDays.map((day) => {
                const dateStr = dateToStr(day);
                const isCurrentMonth = isSameMonth(day, viewMonth);
                const isFuture = isAfter(dateStr, today);
                const isSelected = isSameDay(dateStr, selectedDate);
                const isTodayCell = isSameDay(dateStr, today);

                const isLocked = lockThreshold ? isBefore(dateStr, lockThreshold) : false;

                const metric = metricsMap.get(dateStr);
                let status: MetricStatus | null = null;
                let showRing = false;

                if (isTodayCell && todayStatus) {
                  status = todayStatus;
                  showRing = true;
                } else if (metric) {
                  status = classifyDay(goalType, {
                    actual_calories: metric.actual_calories,
                    target_calories: metric.target_calories,
                    actual_protein: metric.actual_protein,
                    target_protein: metric.target_protein,
                  });
                  showRing = true;
                }

                const isDisabled = !isCurrentMonth || isFuture;
                const color = status ? colorForDayStatus(status) : 'rgba(255,255,255,0.15)';

                return (
                  <motion.button
                    key={dateStr}
                    type="button"
                    onClick={() => handleDayClick(dateStr)}
                    disabled={isDisabled}
                    whileTap={{ scale: 0.92 }}
                    className={cn(
                      'relative flex flex-col items-center justify-center',
                      'aspect-square min-h-[52px] rounded-[16px]',
                      'transition-colors duration-150',
                      isDisabled
                        ? 'cursor-not-allowed'
                        : 'cursor-pointer hover:bg-zinc-900/40',
                      !showRing && isCurrentMonth && 'opacity-90',
                      !isCurrentMonth && 'opacity-25',
                    )}
                    style={{
                      background: isSelected
                        ? 'radial-gradient(circle at 50% 40%, rgba(212,255,0,0.18) 0%, rgba(212,255,0,0.04) 60%, transparent 100%)'
                        : isTodayCell
                        ? 'rgba(255,255,255,0.03)'
                        : 'transparent',
                      boxShadow: isSelected
                        ? 'inset 0 0 0 1.5px rgba(212,255,0,0.45), 0 0 24px rgba(212,255,0,0.18)'
                        : 'none',
                    }}
                  >
                    <div className="flex items-center justify-center h-[26px] relative">
                      {showRing ? (
                        <MicroRing
                          current={1}
                          goal={1}
                          size={26}
                          strokeWidth={2.2}
                          color={isSelected ? '#D4FF00' : color}
                        />
                      ) : (
                        <div className="w-[26px] h-[26px] rounded-full border border-[rgba(255,255,255,0.06)]" />
                      )}
                      {isLocked && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#0A0A0A] flex items-center justify-center border border-[rgba(255,255,255,0.1)] z-10 shadow-sm">
                          <Lock size={9} className="text-[#D4FF00]" />
                        </div>
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-[12px] font-semibold mt-[2px] tabular-nums',
                        isSelected
                          ? 'text-[#D4FF00]'
                          : isTodayCell
                          ? 'text-white'
                          : isCurrentMonth
                          ? 'text-white/80'
                          : 'text-zinc-600',
                      )}
                    >
                      {day.getDate()}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-4 gap-2 px-5 py-4 border-t border-[rgba(255,255,255,0.05)]">
            {[
              { label: 'Poor', color: '#FF4D1C' },
              { label: 'Okay', color: '#fbbf24' },
              { label: 'Good', color: '#D4FF00' },
              { label: 'No data', color: 'rgba(255,255,255,0.15)' },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-1.5">
                <div
                  className="w-4 h-4 rounded-full border-2"
                  style={{ borderColor: item.color }}
                />
                <span className="text-[10px] font-medium text-zinc-500 tracking-wide">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={!!upgradeTeaserDate}
        onClose={() => setUpgradeTeaserDate(null)}
        maxHeight="auto"
      >
        <div className="flex flex-col items-center text-center px-6 py-8">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
            style={{
              background: 'radial-gradient(circle at 30% 30%, rgba(212,255,0,0.18), rgba(212,255,0,0.04))',
              border: '1px solid rgba(212,255,0,0.3)',
              boxShadow: '0 0 32px rgba(212,255,0,0.15)'
            }}
          >
            <Lock size={28} className="text-[#D4FF00]" />
          </div>
          <h3 className="text-[22px] font-semibold text-white tracking-tight mb-2">
            This day is locked
          </h3>
          <p className="text-[14px] text-zinc-400 leading-relaxed mb-6 max-w-[280px]">
            Upgrade to see detailed meals for {upgradeTeaserDate ? formatDateHeading(upgradeTeaserDate) : 'this day'}.
          </p>
          <button
            onClick={() => {
              setUpgradeTeaserDate(null);
              onClose();
              navigate('/pricing');
            }}
            className="w-full bg-[#D4FF00] text-black font-semibold py-3.5 rounded-full mb-2 hover:brightness-110 transition-all"
          >
            View plans ›
          </button>
          <button
            onClick={() => setUpgradeTeaserDate(null)}
            className="w-full py-3 text-[14px] font-medium text-zinc-500 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </BottomSheet>
    </>
  );
}