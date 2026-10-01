import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Utensils, Check, Flame, Beef, Wheat, Droplet, Leaf } from 'lucide-react';
import { cn } from '@/shared/utils/utils';

interface PreCommitEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: {
    meal_text: string;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
  }) => void;
  initial: {
    meal_text: string;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber?: number;
  } | null;
}

const isValidMacro = (v: string) => v !== '' && !Number.isNaN(Number(v)) && Number(v) >= 0;

function sanitizeDecimal(raw: string): string {
  const v = raw.replace(/[^0-9.]/g, '');
  const parts = v.split('.');
  return parts.length > 1 ? parts[0] + '.' + parts.slice(1).join('') : v;
}

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[rgba(255,255,255,0.4)]">
    {children}
  </div>
);
const NumField = ({
  value, onChange, placeholder, label, unit, Icon,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
  unit: string;
  Icon: typeof Flame;
}) => (
  <label className="group flex flex-col gap-2 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-3.5 py-3 transition-colors focus-within:border-[rgba(212,255,0,0.4)] focus-within:bg-[rgba(255,255,255,0.03)] sm:px-4 sm:py-3.5">
    <span className="flex items-center gap-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-[rgba(255,255,255,0.4)] sm:text-[11px]">
      <Icon size={12} className="text-[rgba(255,255,255,0.35)]" />
      {label}
    </span>
    <div className="flex items-baseline justify-between">
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(sanitizeDecimal(e.target.value))}
        placeholder={placeholder}
        className="w-full bg-transparent text-[16px] font-semibold text-white placeholder:text-[rgba(255,255,255,0.25)] outline-none tabular-nums sm:text-[17px]"
      />
      <span className="ml-2 shrink-0 text-[12px] font-medium text-[rgba(255,255,255,0.4)]">
        {unit}
      </span>
    </div>
  </label>
);

export function PreCommitEditModal({ isOpen, onClose, onSave, initial }: PreCommitEditModalProps) {
  // SSR guard (mirrors EditMealModal) — no hooks run when there is no DOM.
  if (typeof document === 'undefined') return null;

  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fiber, setFiber] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Prefill from the parsed estimate every time the sheet opens.
  useEffect(() => {
    if (!isOpen || !initial) return undefined;
    setName(initial.meal_text ?? '');
    setCalories(String(initial.calories ?? ''));
    setProtein(String(initial.protein ?? ''));
    setFat(String(initial.fat ?? ''));
    setCarbs(String(initial.carbs ?? ''));
    setFiber(initial.fiber === undefined || initial.fiber === null ? '' : String(initial.fiber));
    return undefined;
  }, [isOpen, initial]);

  // Autofocus the meal name once the sheet is mounted.
  useEffect(() => {
    if (!isOpen) return undefined;
    const t = window.setTimeout(() => nameInputRef.current?.focus(), 60);
    return () => window.clearTimeout(t);
  }, [isOpen]);

  // Escape closes the sheet.
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!isOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);


  const isValid =
    name.trim().length > 0 &&
    isValidMacro(calories) &&
    isValidMacro(protein) &&
    isValidMacro(fat) &&
    isValidMacro(carbs) &&
    (fiber === '' || isValidMacro(fiber));

  const handleSave = () => {
    if (!isValid) return;
    onSave({
      meal_text: name.trim(),
      calories: Number(calories),
      protein: Number(protein),
      fat: Number(fat),
      carbs: Number(carbs),
      fiber: fiber === '' ? 0 : Number(fiber),
    });
    onClose();
  };

  return createPortal(
    (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] flex items-end justify-center bg-[rgba(0,0,0,0.65)] p-0 backdrop-blur-[6px] sm:items-center sm:p-6"
            role="presentation"
          >
            <motion.div
              initial={{ y: 64, opacity: 0.6, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 48, opacity: 0, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Edit estimate"
              className="flex max-h-[92dvh] w-full max-w-[560px] flex-col overflow-hidden rounded-t-[32px] border border-[rgba(255,255,255,0.08)] bg-[#0F0F10] shadow-[0_32px_80px_-24px_rgba(0,0,0,0.8)] sm:rounded-[32px]"
            >
              <div className="flex shrink-0 items-start justify-between gap-3 px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
                <div>
                  <h2 className="text-[20px] font-bold tracking-tight text-white sm:text-[22px]">
                    Edit Estimate
                  </h2>
                  <p className="mt-1 text-[13px] font-medium text-[rgba(255,255,255,0.5)]">
                    Adjust before logging.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close editor"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.6)] transition-colors hover:bg-[rgba(255,255,255,0.1)] hover:text-white"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6">
                <section className="mb-3.5 sm:mb-4">
                  <SectionLabel>Meal</SectionLabel>
                  <div
                    className={cn(
                      'flex items-center gap-3 rounded-2xl border bg-[rgba(255,255,255,0.02)] px-3.5 py-3 transition-colors sm:px-4 sm:py-3.5',
                      nameFocused
                        ? 'border-[rgba(212,255,0,0.4)] bg-[rgba(255,255,255,0.03)]'
                        : 'border-[rgba(255,255,255,0.06)]',
                    )}
                  >
                    <Utensils
                      size={15}
                      className={nameFocused ? 'shrink-0 text-[#D4FF00]' : 'shrink-0 text-[rgba(255,255,255,0.35)]'}
                    />
                    <input
                      ref={nameInputRef}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onFocus={() => setNameFocused(true)}
                      onBlur={() => setNameFocused(false)}
                      placeholder="e.g. Chicken Salad"
                      className="w-full bg-transparent text-[16px] font-medium text-white placeholder:text-[rgba(255,255,255,0.3)] outline-none"
                    />
                  </div>
                </section>

                <section className="mb-2">
                  <SectionLabel>Nutrition Info</SectionLabel>
                  <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                    <NumField value={calories} onChange={setCalories} placeholder="0" label="Calories" unit="kcal" Icon={Flame} />
                    <NumField value={protein} onChange={setProtein} placeholder="0" label="Protein" unit="g" Icon={Beef} />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:mt-2.5 sm:gap-2.5">
                    <NumField value={fat} onChange={setFat} placeholder="0" label="Fat" unit="g" Icon={Droplet} />
                    <NumField value={carbs} onChange={setCarbs} placeholder="0" label="Carbs" unit="g" Icon={Wheat} />
                  </div>
                  <div className="mt-2 sm:mt-2.5">
                    <NumField value={fiber} onChange={setFiber} placeholder="0" label="Fiber (Optional)" unit="g" Icon={Leaf} />
                  </div>
                </section>
              </div>

              <div className="shrink-0 border-t border-[rgba(255,255,255,0.06)] bg-[rgba(15,15,16,0.9)] px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3.5 sm:px-6 sm:pb-[max(16px,env(safe-area-inset-bottom))] sm:pt-4">
                <motion.button
                  type="button"
                  onClick={handleSave}
                  disabled={!isValid}
                  whileTap={isValid ? { scale: 0.98 } : undefined}
                  className={cn(
                    'flex w-full items-center justify-center gap-2 rounded-xl text-[14.5px] font-semibold transition-colors sm:rounded-2xl sm:text-[15px]',
                    isValid
                      ? 'bg-[#D4FF00] text-[#0A0A0A] shadow-[0_8px_24px_-8px_rgba(212,255,0,0.5)] hover:bg-[#C8F200]'
                      : 'cursor-not-allowed bg-[rgba(212,255,0,0.15)] text-[rgba(212,255,0,0.4)]',
                  )}
                  style={{ height: 48 }}
                >
                  <Check size={17} strokeWidth={2.5} />
                  Use These Values
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    ),
    document.body,
  );
}
