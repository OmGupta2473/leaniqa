import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { getWeekLabel } from '@/shared/utils/weekKey';
import { cn } from '@/shared/utils/utils';

interface WeekSelectorProps {
  weekStart: string;
  status: 'live' | 'final';
  showGraceHint: boolean;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onOpenPicker: () => void;
}

export function WeekSelector({
  weekStart,
  status,
  showGraceHint,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  onOpenPicker,
}: WeekSelectorProps) {
  const label = getWeekLabel(weekStart);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      if (active) {
        const tag = active.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || active.isContentEditable) return;
      }
      if (e.key === 'ArrowLeft' && canGoPrev) {
        e.preventDefault();
        onPrev();
      } else if (e.key === 'ArrowRight' && canGoNext) {
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [canGoPrev, canGoNext, onPrev, onNext]);

  const arrowClass = (enabled: boolean) =>
    cn(
      'w-11 h-11 rounded-full flex items-center justify-center outline-none transition-all duration-200',
      enabled
        ? 'bg-[rgba(255,255,255,0.05)] backdrop-blur-md border border-[rgba(255,255,255,0.08)] text-white hover:bg-[rgba(255,255,255,0.1)] hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#D4FF00]'
        : 'text-zinc-700 cursor-not-allowed opacity-50',
    );

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full gap-4">
        <button
          type="button"
          onClick={onPrev}
          disabled={!canGoPrev}
          aria-label="Previous week"
          className={arrowClass(canGoPrev)}
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex-1 flex justify-center min-w-0">
          <button
            type="button"
            onClick={onOpenPicker}
            className="group flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4FF00] rounded-lg px-2 py-1 -mx-2 transition-colors hover:bg-[rgba(255,255,255,0.04)]"
            aria-label="Select week"
          >
            <motion.div
              key={weekStart}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              className="text-[17px] font-semibold text-white tracking-tight tabular-nums truncate group-hover:text-[#D4FF00] transition-colors"
            >
              {label}
            </motion.div>
            <ChevronDown
              size={16}
              className="text-zinc-500 group-hover:text-[#D4FF00] transition-colors shrink-0"
            />
          </button>
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext}
          aria-label="Next week"
          className={arrowClass(canGoNext)}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={cn(
          'px-3 py-1 rounded-full text-[11px] font-bold tracking-[0.08em] uppercase backdrop-blur-md',
          status === 'final'
            ? 'bg-[#D4FF00]/15 text-[#D4FF00] border border-[#D4FF00]/30 shadow-[0_0_20px_rgba(212,255,0,0.15)]'
            : 'bg-[rgba(255,255,255,0.05)] text-zinc-300 border border-[rgba(255,255,255,0.08)]',
        )}
      >
        {status === 'final' ? 'Final report' : 'Live report'}
      </motion.div>

      {showGraceHint && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="text-[12px] text-zinc-500 text-center leading-relaxed"
        >
          Late logs still count until Monday night
        </motion.p>
      )}
    </div>
  );
}