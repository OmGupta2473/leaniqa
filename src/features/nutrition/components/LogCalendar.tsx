import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BottomSheet } from '@/shared/components/BottomSheet';
import { MicroRing } from '@/features/reports/components/MicroRing';
import { classifyDay, colorForDayStatus, type MetricStatus, type GoalType } from '@/shared/utils/dayStatus';
import { getKolkataDateString } from '@/shared/utils/timezone';
import { cn } from '@/shared/utils/utils';
import { motion } from 'motion/react';
import { parseDateKey } from '@/shared/utils/dateKey';
import { DbDailyMetric } from '@/shared/types/supabase';

interface LogCalendarProps {
  isOpen: boolean;
  onClose: () => void;
  floorDate: string;
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  goalType: GoalType;
  todayStatus?: MetricStatus | null;
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
  // Monday-first index: Mon=0, Tue=1, ..., Sun=6
  const firstDayOfWeek = (getDayOfWeek(firstDay) + 6) % 7;
  
  const days: Date[] = [];
  
  // Leading days from previous month — ASCENDING order (oldest first)
  for (let i = firstDayOfWeek; i >= 1; i--) {
    days.push(addDays(firstDay, -i));
  }
  
  // Days of current month
  const daysInMonth = lastDay.getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(firstDay.getFullYear(), firstDay.getMonth(), d));
  }
  
  // Trailing days — fill to 42 cells (6 rows), forward from the last real day
  while (days.length < 42) {
    days.push(addDays(days[days.length - 1], 1));
  }
  
  return days;
}

export function LogCalendar({
  isOpen,
  onClose,
  floorDate,
  selectedDate,
  onSelectDate,
  goalType,
  todayStatus,
  metrics,
}: LogCalendarProps) {
  if (typeof document === 'undefined') return null;

  const today = getKolkataDateString();
  const [viewMonth, setViewMonth] = useState<Date>(startOfMonth(new Date()));

  const metricsMap = useMemo(() => {
    const map = new Map<string, DbDailyMetric>();
    for (const m of metrics) {
      map.set(m.date, m);
    }
    return map;
  }, [metrics]);

  const inRange = useMemo(() => {
    const floor = parseDateKey(floorDate);
    const todayObj = new Date();
    const start = startOfMonth(floor);
    const end = endOfMonth(todayObj);
    
    const dates = new Set<string>();
    let current = start;
    while (current <= end) {
      dates.add(getKolkataDateString(current));
      current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
    }
    return dates;
  }, [floorDate]);

  const goPrevMonth = () => {
    setViewMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };

  const goNextMonth = () => {
    setViewMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  const canGoPrev = !isSameMonth(viewMonth, startOfMonth(parseDateKey(floorDate)));
  const canGoNext = !isSameMonth(viewMonth, startOfMonth(new Date()));

  const handleDayClick = (dateStr: string) => {
    if (!inRange.has(dateStr)) return;
    if (isAfter(dateStr, getKolkataDateString())) return;
    onSelectDate(dateStr);
    onClose();
  };

  const gridDays = getMonthGrid(viewMonth);

  return (
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
              const isInRange = inRange.has(dateStr);
              const isFuture = isAfter(dateStr, getKolkataDateString());
              const isBeforeFloor = isBefore(dateStr, floorDate);
              const isSelected = isSameDay(dateStr, selectedDate);
              const isTodayCell = isSameDay(dateStr, getKolkataDateString());

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

              const isDisabled = !isCurrentMonth || !isInRange || isFuture || isBeforeFloor;
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
                  <div className="flex items-center justify-center h-[26px]">
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
  );
}