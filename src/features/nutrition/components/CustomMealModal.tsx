import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Utensils, Plus, Sunrise, Sun, Moon, Coffee,
  Flame, Beef, Wheat, Droplet, Leaf, Info,
} from 'lucide-react';
import { cn } from '@/shared/utils/utils';
import { haptics } from '@/shared/utils/haptics';
import { DbMealLog } from '@/shared/types/supabase';

type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface CustomMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (meal: Omit<DbMealLog, 'id' | 'user_id'>) => void;
  defaultSlot?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | '';
}

const SLOTS: { id: MealSlot; label: string; Icon: typeof Sunrise }[] = [
  { id: 'breakfast', label: 'Breakfast', Icon: Sunrise },
  { id: 'lunch', label: 'Lunch', Icon: Sun },
  { id: 'dinner', label: 'Dinner', Icon: Moon },
  { id: 'snack', label: 'Snack', Icon: Coffee },
];

const isValidMacro = (v: string) => v !== '' && !Number.isNaN(Number(v)) && Number(v) >= 0;

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
  <label className="group flex flex-col gap-2 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-4 py-3.5 transition-colors focus-within:border-[rgba(212,255,0,0.4)] focus-within:bg-[rgba(255,255,255,0.03)]">
    <span className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em] text-[rgba(255,255,255,0.4)]">
      <Icon size={12} className="text-[rgba(255,255,255,0.35)]" />
      {label}
    </span>
    <div className="flex items-baseline justify-between">
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange((() => {
          const v = e.target.value.replace(/[^0-9.]/g, '');
          const parts = v.split('.');
          return parts.length > 1 ? parts[0] + '.' + parts.slice(1).join('') : v;
        })())}
        placeholder={placeholder}
        className="w-full bg-transparent text-[17px] font-semibold text-white placeholder:text-[rgba(255,255,255,0.25)] outline-none tabular-nums"
      />
      <span className="ml-2 shrink-0 text-[12px] font-medium text-[rgba(255,255,255,0.4)]">
        {unit}
      </span>
    </div>
  </label>
);

export function CustomMealModal({ isOpen, onClose, onSave, defaultSlot }: CustomMealModalProps) {
  // SSR guard (restored) — no hooks run when there is no DOM.
  if (typeof document === 'undefined') return null;

  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [slot, setSlot] = useState<MealSlot>(defaultSlot || 'dinner');
  const [nameFocused, setNameFocused] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSlot(defaultSlot || 'dinner');
      const t = setTimeout(() => nameInputRef.current?.focus(), 260);
      return () => clearTimeout(t);
    }
    setName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setFiber('');
    return undefined;
  }, [isOpen, defaultSlot]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const p = Number(protein) || 0;
  const c = Number(carbs) || 0;
  const f = Number(fat) || 0;
  const calculatedCalories = p * 4 + c * 4 + f * 9;
  const totalMacros = p + c + f;
  const cals = Number(calories) || 0;
  const isCaloriesMismatched =
    totalMacros > 0 && Math.abs(cals - calculatedCalories) > Math.max(cals * 0.2, 50);
  const showPreview = totalMacros > 0 || cals > 0;

  const isValid =
    name.trim().length > 0 &&
    isValidMacro(calories) &&
    isValidMacro(protein) &&
    isValidMacro(carbs) &&
    isValidMacro(fat);

  const numberValue = (v: string) => Math.round(Number(v) || 0);

  const handleSave = () => {
    if (!isValid) return;
    onSave({
      meal_text: name.trim(),
      calories: numberValue(calories),
      protein: numberValue(protein),
      fat: numberValue(fat),
      carbs: numberValue(carbs),
      fiber: numberValue(fiber),
      meal_slot: slot,
      meal_time: new Date().toISOString(),
      tip: 'Manually logged meal.',
    });
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="cm-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[110] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
          onClick={onClose}
        >
          <motion.div
            key="cm-panel"
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[520px] overflow-hidden rounded-t-[32px] border border-[rgba(255,255,255,0.08)] bg-[#0F0F10]/95 shadow-[0_-8px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl sm:rounded-[32px]"
            role="dialog"
            aria-modal="true"
            aria-label="Create custom meal"
          >
            <div className="mx-auto mt-3 h-1 w-9 rounded-full bg-[rgba(255,255,255,0.15)] sm:hidden" />

            <div className="flex items-start justify-between px-6 pt-5 pb-4 sm:pt-6">
              <div className="min-w-0 pr-4">
                <h2 className="text-[22px] font-semibold tracking-tight text-white">
                  Create Custom Meal
                </h2>
                <p className="mt-1 text-[13px] leading-snug text-[rgba(255,255,255,0.5)]">
                  Save your favorite meals for quick logging
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-[rgba(255,255,255,0.7)] transition-colors hover:bg-[rgba(255,255,255,0.08)] active:scale-95"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-6 pb-4 sm:max-h-[75vh]">
              <section className="mb-6">
                <SectionLabel>Meal Name</SectionLabel>
                <div
                  className={cn(
                    'relative flex items-center gap-3 rounded-2xl border bg-[rgba(255,255,255,0.02)] px-4 py-3.5 transition-all',
                    nameFocused
                      ? 'border-[rgba(212,255,0,0.45)] bg-[rgba(212,255,0,0.03)] shadow-[0_0_0_4px_rgba(212,255,0,0.06)]'
                      : 'border-[rgba(255,255,255,0.06)]',
                  )}
                >
                  <Utensils
                    size={16}
                    className={nameFocused ? 'text-[#D4FF00]' : 'text-[rgba(255,255,255,0.35)]'}
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

              <section className="mb-6">
                <SectionLabel>Meal Slot</SectionLabel>
                <div className="grid grid-cols-4 gap-2 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-1.5">
                  {SLOTS.map(({ id, label, Icon }) => {
                    const active = slot === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          haptics.tap();
                          setSlot(id);
                        }}
                        className={cn(
                          'relative flex flex-col items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-medium transition-colors',
                          active
                            ? 'text-[#0A0A0A]'
                            : 'text-[rgba(255,255,255,0.55)] hover:text-white',
                        )}
                        aria-pressed={active}
                      >
                        {active && (
                          <motion.div
                            layoutId="custom-meal-slot-pill"
                            className="absolute inset-0 rounded-xl bg-[#D4FF00]"
                            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                          />
                        )}
                        <span className="relative z-10 flex flex-col items-center gap-1">
                          <Icon size={15} strokeWidth={2} />
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="mb-2">
                <SectionLabel>Nutrition Info</SectionLabel>
                <div className="grid grid-cols-2 gap-2.5">
                  <NumField
                    value={calories}
                    onChange={setCalories}
                    placeholder="0"
                    label="Calories"
                    unit="kcal"
                    Icon={Flame}
                  />
                  <NumField
                    value={protein}
                    onChange={setProtein}
                    placeholder="0"
                    label="Protein"
                    unit="g"
                    Icon={Beef}
                  />
                  <NumField
                    value={carbs}
                    onChange={setCarbs}
                    placeholder="0"
                    label="Carbs"
                    unit="g"
                    Icon={Wheat}
                  />
                  <NumField
                    value={fat}
                    onChange={setFat}
                    placeholder="0"
                    label="Fat"
                    unit="g"
                    Icon={Droplet}
                  />
                </div>
                <div className="mt-2.5">
                  <NumField
                    value={fiber}
                    onChange={setFiber}
                    placeholder="0"
                    label="Fiber (Optional)"
                    unit="g"
                    Icon={Leaf}
                  />
                </div>

                {/* Live macro preview + calorie/macro mismatch warning (restored) */}
                {showPreview && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2.5 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-4 py-3.5">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[rgba(255,255,255,0.4)]">
                          Macro Split
                        </span>
                        {totalMacros > 0 && (
                          <span className="text-[12px] font-medium tabular-nums text-[rgba(255,255,255,0.4)]">
                            ~{Math.round(calculatedCalories)} kcal implied
                          </span>
                        )}
                      </div>

                      {totalMacros > 0 ? (
                        <div className="flex h-2 w-full overflow-hidden rounded-full">
                          <div
                            style={{ width: `${(p / totalMacros) * 100}%` }}
                            className="bg-[#FF4D1C]"
                          />
                          <div
                            style={{ width: `${(c / totalMacros) * 100}%` }}
                            className="bg-[#4D9FFF]"
                          />
                          <div
                            style={{ width: `${(f / totalMacros) * 100}%` }}
                            className="bg-[#FFB347]"
                          />
                        </div>
                      ) : (
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]" />
                      )}

                      <div className="mt-3 flex items-center justify-between text-[12px]">
                        <span className="flex items-center gap-1.5 text-[rgba(255,255,255,0.6)]">
                          <span className="h-2 w-2 rounded-full bg-[#FF4D1C]" />
                          <span className="tabular-nums">
                            {totalMacros > 0 ? Math.round((p / totalMacros) * 100) : 0}% Pro
                          </span>
                        </span>
                        <span className="flex items-center gap-1.5 text-[rgba(255,255,255,0.6)]">
                          <span className="h-2 w-2 rounded-full bg-[#4D9FFF]" />
                          <span className="tabular-nums">
                            {totalMacros > 0 ? Math.round((c / totalMacros) * 100) : 0}% Carb
                          </span>
                        </span>
                        <span className="flex items-center gap-1.5 text-[rgba(255,255,255,0.6)]">
                          <span className="h-2 w-2 rounded-full bg-[#FFB347]" />
                          <span className="tabular-nums">
                            {totalMacros > 0 ? Math.round((f / totalMacros) * 100) : 0}% Fat
                          </span>
                        </span>
                      </div>

                      {isCaloriesMismatched && (
                        <div className="mt-3.5 flex gap-2 rounded-xl border border-[rgba(255,179,71,0.2)] bg-[rgba(255,179,71,0.1)] p-3 text-[12px] leading-relaxed text-[#FFB347]">
                          <Info size={14} className="mt-0.5 shrink-0" />
                          <span>
                            The calories you entered ({cals} kcal) differ from the macros (
                            {Math.round(calculatedCalories)} kcal). We'll still save what you entered.
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </section>
            </div>

            <div className="border-t border-[rgba(255,255,255,0.06)] bg-[rgba(15,15,16,0.9)] px-6 pb-[max(16px,env(safe-area-inset-bottom))] pt-4">
              <motion.button
                type="button"
                onClick={handleSave}
                disabled={!isValid}
                whileTap={isValid ? { scale: 0.98 } : undefined}
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold transition-colors',
                  isValid
                    ? 'bg-[#D4FF00] text-[#0A0A0A] shadow-[0_8px_24px_-8px_rgba(212,255,0,0.5)] hover:bg-[#C8F200]'
                    : 'cursor-not-allowed bg-[rgba(212,255,0,0.15)] text-[rgba(212,255,0,0.4)]',
                )}
                style={{ height: 52 }}
              >
                <Plus size={18} strokeWidth={2.5} />
                Save Custom Meal
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
