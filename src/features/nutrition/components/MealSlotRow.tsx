import React, { useState } from 'react';
import { PerfProfiler } from '@/shared/utils/perfDebug';
import { X, ChevronDown, GripVertical, BookOpen, ScanLine, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/shared/utils/utils';
import { haptics } from '@/shared/utils/haptics';
import { useToast } from '@/shared/components/Toast';

// Shared display formatter: max 1 decimal place, strips trailing ".0".
// Exported so MealLoggerPage (member view) and MemberMealsView (owner view)
// share the exact same formatting rules. Moving it out of MealLoggerPage
// removes a copy-paste hazard without changing any rendered value.
export const formatMacro = (v: number) => Number(v.toFixed(1)).toString();

interface MealSlotRowProps {
  slot: string;
  icon: React.ReactNode;
  label: string;
  timeRange: string;
  meals: any[];
  onDelete?: (id: string) => void;
  onEdit?: (meal: any) => void;
  onDropMeal?: (mealId: string, newSlot: string) => void;
  /**
   * When true: no drag handle, no delete button, no edit tap, no drop
   * handler. Used by gym owner read-only member views (Session 3).
   * Defaults to false; member-facing pages pass nothing and behavior is
   * identical to pre-extraction.
   */
  readOnly?: boolean;
}

export function MealSlotRow({
  slot, icon, label, timeRange, meals,
  onDelete, onEdit, onDropMeal, readOnly = false,
}: MealSlotRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const { toast } = useToast();
  const kcal = meals.reduce((s, m) => s + m.calories, 0);
  const pro = meals.reduce((s, m) => s + m.protein, 0);

  const dragProps = readOnly
    ? {}
    : {
        onDragOver: (e: React.DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          setIsDragOver(true);
        },
        onDragLeave: () => setIsDragOver(false),
        onDrop: (e: React.DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          setIsDragOver(false);
          const mealId = e.dataTransfer.getData('text/plain');
          if (mealId && onDropMeal) onDropMeal(mealId, slot);
        },
      };

  return (
    <PerfProfiler id="MealSlotRow">
      <motion.div
        layout
        {...dragProps}
        className={cn(
          'mb-4 overflow-hidden rounded-[24px] border shadow-sm backdrop-blur-xl transition-all duration-300',
          isDragOver
            ? 'bg-[rgba(212,255,0,0.08)] border-[#D4FF00] ring-2 ring-[#D4FF00]/20 scale-[1.01]'
            : 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.05)]',
        )}
      >
        <div
          className="p-5 flex items-center justify-between select-none cursor-pointer"
          onClick={() => { haptics.tap(); setExpanded(!expanded); }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[16px] bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[rgba(255,255,255,0.8)] shadow-inner">
              {icon}
            </div>
            <div>
              <div className="text-[17px] font-semibold text-white tracking-tight">{label}</div>
              <div className="text-[13px] font-medium text-[rgba(255,255,255,0.4)] mt-0.5">{timeRange}</div>
            </div>
          </div>
          <div className="flex items-center gap-5 text-right">
            <div>
              <div className="text-[16px] font-bold text-white tracking-tight">
                {formatMacro(kcal)} <span className="text-[12px] font-medium text-[rgba(255,255,255,0.5)] uppercase tracking-wider">kcal</span>
              </div>
              <div className="text-[13px] font-semibold text-[#378ADD] mt-0.5">
                {formatMacro(pro)}<span className="text-[10px] font-medium opacity-70 uppercase tracking-wider">g pro</span>
              </div>
            </div>
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }}>
              <ChevronDown size={20} className="text-[rgba(255,255,255,0.4)]" />
            </motion.div>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 space-y-3 border-t border-[rgba(255,255,255,0.06)] pt-4">
                {meals.length > 0 ? meals.map((m, i) => (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={m.id || i}
                    draggable={readOnly ? false : !!m.id}
                    onDragStart={readOnly ? undefined : (e) => {
                      const de = e as unknown as React.DragEvent<HTMLDivElement>;
                      de.dataTransfer.setData('text/plain', m.id);
                      de.dataTransfer.effectAllowed = 'move';
                      setDraggingId(m.id);
                    }}
                    onDragEnd={readOnly ? undefined : () => setDraggingId(null)}
                    className={cn(
                      'flex items-center justify-between group p-2.5 sm:p-3 rounded-[16px] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)] transition-colors gap-2',
                      draggingId === m.id && 'opacity-30 border border-dashed border-[#D4FF00]/50',
                    )}
                  >
                    {!readOnly && (
                      <div className="flex items-center gap-1.5 shrink-0 cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400">
                        <GripVertical size={14} />
                      </div>
                    )}
                    {readOnly ? (
                      <div className="flex-1 min-w-0 pr-1 flex flex-col justify-center items-start gap-1 text-left">
                        <MealRowContent m={m} />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onEdit && onEdit(m)}
                        aria-label="Edit meal"
                        className="flex-1 min-w-0 pr-1 flex flex-col justify-center items-start gap-1 text-left cursor-pointer"
                      >
                        <MealRowContent m={m} />
                      </button>
                    )}
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[8.5px] bg-[rgba(255,77,28,0.12)] text-[#FF4D1C] px-1.5 py-0.5 rounded-full font-bold tracking-wide whitespace-nowrap">{formatMacro(m.calories)} KCAL</span>
                      <span className="text-[8.5px] badge-lime px-1.5 py-0.5 font-bold rounded-full tracking-wide whitespace-nowrap">{formatMacro(m.protein)}G PRO</span>
                      {!readOnly && m.id && !m.id.toString().startsWith('opt-') && (
                        <button
                          aria-label="Delete meal"
                          className="ml-0.5 w-6 h-6 shrink-0 rounded-full bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,77,28,0.2)] flex items-center justify-center text-[rgba(255,255,255,0.5)] hover:text-[#FF4D1C] transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            toast({
                              type: 'warning',
                              message: 'Delete meal?',
                              duration: 5000,
                              action: {
                                label: 'Delete',
                                onClick: () => onDelete && onDelete(m.id),
                              },
                            });
                          }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                )) : (
                  <div className="text-[14px] text-[rgba(255,255,255,0.4)] text-center py-4 font-medium">Nothing logged yet</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </PerfProfiler>
  );
}

function MealRowContent({ m }: { m: any }) {
  return (
    <>
      <div className="text-[13px] leading-tight font-medium text-[rgba(255,255,255,0.9)] capitalize break-words whitespace-normal break-all sm:break-normal">{m.meal_text}</div>
      <div className="flex flex-wrap gap-1.5 mt-0.5">
        {m._localOnly && (
          <span className="text-[9px] bg-[rgba(255,255,255,0.1)] text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">Offline</span>
        )}
        {(m.meal_source === 'manual' || m.tip === 'Manually logged meal.') && (
          <span className="text-[9px] bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.5)] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider flex items-center gap-1 shrink-0">Manual</span>
        )}
        {m.meal_source === 'barcode' && (
          <span title="Scanned barcode" aria-label="Scanned barcode" className="text-[9px] bg-[rgba(55,138,221,0.12)] text-[#378ADD] border border-[rgba(55,138,221,0.25)] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider flex items-center gap-1 shrink-0">
            <ScanLine size={10} strokeWidth={2.5} /> Scanned
          </span>
        )}
        {(m.meal_source === 'kb' || m.meal_source === 'memory_cache' || m.meal_source === 'db_cache') && (
          <span title="Resolved via Leaniqa Knowledge Base" aria-label="Resolved via Leaniqa Knowledge Base" className="text-[9px] bg-[rgba(212,255,0,0.06)] text-[#D4FF00] border border-[rgba(212,255,0,0.18)] px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-1 shrink-0">
            <BookOpen size={10} strokeWidth={2.5} /> Knowledge Base
          </span>
        )}
        {m.meal_source === 'ai' && (
          <span title="Resolved via AI meal parsing" aria-label="Resolved via AI meal parsing" className="text-[9px] bg-[rgba(55,138,221,0.12)] text-[#378ADD] border border-[rgba(55,138,221,0.25)] px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-1 shrink-0">
            <Sparkles size={10} strokeWidth={2.5} /> AI
          </span>
        )}
      </div>
    </>
  );
}