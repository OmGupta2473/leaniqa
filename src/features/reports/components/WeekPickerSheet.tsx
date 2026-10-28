import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { BottomSheet } from '@/shared/components/BottomSheet';
import { getWeekLabel, shiftWeek } from '@/shared/utils/weekKey';
import { cn } from '@/shared/utils/utils';

interface WeekPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentWeekStart: string;
  earliestWeekStart: string;
  selectedWeekStart: string;
  onSelect: (weekStart: string) => void;
}

export function WeekPickerSheet({
  isOpen,
  onClose,
  currentWeekStart,
  earliestWeekStart,
  selectedWeekStart,
  onSelect,
}: WeekPickerSheetProps) {
  if (typeof document === 'undefined') return null;

  // Generate list of weeks from current back to earliest
  const weeks = useMemo(() => {
    const list: string[] = [];
    let cursor = currentWeekStart;
    
    // Safety bound to prevent infinite loops if dates are malformed
    let limit = 200; 
    
    while (cursor >= earliestWeekStart && limit > 0) {
      list.push(cursor);
      cursor = shiftWeek(cursor, -1);
      limit--;
    }
    return list;
  }, [currentWeekStart, earliestWeekStart]);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="80dvh">
      <div className="flex flex-col h-full">
        <div className="px-5 pt-4 pb-4 border-b border-[rgba(255,255,255,0.06)] shrink-0">
          <h3 className="text-[20px] font-semibold text-white tracking-tight">
            Select Week
          </h3>
          <p className="text-[13px] text-zinc-500 mt-1">
            Past weeks and current live week
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {weeks.map((week) => {
            const isSelected = week === selectedWeekStart;
            const isCurrent = week === currentWeekStart;

            return (
              <button
                key={week}
                onClick={() => {
                  onSelect(week);
                  onClose();
                }}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-colors text-left',
                  isSelected
                    ? 'bg-[#D4FF00]/10 border border-[#D4FF00]/30'
                    : 'hover:bg-[rgba(255,255,255,0.04)] border border-transparent'
                )}
              >
                <div className="flex flex-col">
                  <span
                    className={cn(
                      'text-[15px] font-semibold tracking-tight',
                      isSelected ? 'text-[#D4FF00]' : 'text-white'
                    )}
                  >
                    {getWeekLabel(week)}
                  </span>
                  {isCurrent && (
                    <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mt-0.5">
                      Current Week
                    </span>
                  )}
                </div>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-5 h-5 rounded-full bg-[#D4FF00] flex items-center justify-center shrink-0"
                  >
                    <Check size={12} className="text-black" strokeWidth={3} />
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </BottomSheet>
  );
}