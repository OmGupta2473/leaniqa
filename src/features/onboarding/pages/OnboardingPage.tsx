import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle, Armchair, ArrowLeft, ArrowRight, Calendar, Check, Dumbbell,
  Flame, Footprints, ShieldCheck, Target, TrendingDown, TrendingUp, X, Zap,
  Leaf, Egg, Drumstick
} from 'lucide-react';
import { useAuthSession } from '@/router/useAuthSession';
import { profileService } from '@/features/profile/services/profileService';
import { ScreenSkeleton } from '@/shared/components/ScreenSkeleton';
import { useToast } from '@/shared/components/Toast';
import { analytics } from '@/shared/utils/analytics';
import type { DbProfile } from '@/shared/types/supabase';
import {
  calculateBMI,
  calculatePlan,
  estimateTimeline,
  suggestGoal,
  type ActivityLevel,
  type GoalType,
  type OnboardingInput,
} from '@/shared/utils/onboardingMath';
import {
  computeGainPlan,
  computePacePlan,
  CUT_PACES,
  GAIN_PACES,
  type CutPace,
  type GainPace,
} from '@/shared/utils/paceEngine';
import { useOnboardingDraft } from '../useOnboardingDraft';
import type { OnboardingDraft } from '../types';
import { ConsentScreen } from './ConsentScreen';
import { useViewport } from '@/shared/styles/responsive';
import { cn } from '@/shared/utils/utils';
import { haptics } from '@/shared/utils/haptics';
import { syncCurrentWeekReport } from "@/features/reports/utils/syncCurrentWeek";

type DraftProps = {
  draft: OnboardingDraft;
  setDraft: (updater: OnboardingDraft | ((prev: OnboardingDraft) => OnboardingDraft)) => void;
};

const INPUT_CLASS =
  'w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3 text-[15px] text-white placeholder:text-zinc-600 focus:border-[#D4FF00] outline-none transition-colors';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-04-16" -> "16 Apr 2026" without ever parsing through Date (timezone safe). */
function formatIsoDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

function ScalePicker({ value, min, max, step, onChange, formatLabel, formatSubLabel }: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  formatLabel: (val: number) => string;
  formatSubLabel?: (val: number) => string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const ticks = [];
  for (let i = min; i <= max; i += step) {
    ticks.push(i);
  }

  // Sync scroll position when value changes from outside
  useEffect(() => {
    if (!containerRef.current || isDragging.current) return;
    const timer = setTimeout(() => {
      const index = Math.round((value - min) / step);
      const container = containerRef.current;
      if (!container) return;
      const item = container.children[index] as HTMLElement;
      if (item) {
        const scrollPos = item.offsetLeft - container.offsetWidth / 2 + item.offsetWidth / 2;
        container.scrollTo({ left: scrollPos, behavior: 'smooth' });
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [value, min, step]);

  // Calculate nearest value on scroll
  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    const centerX = container.scrollLeft + container.offsetWidth / 2;
    let closestIndex = 0;
    let minDistance = Infinity;
    for (let i = 0; i < container.children.length; i++) {
      const child = container.children[i] as HTMLElement;
      const childCenter = child.offsetLeft + child.offsetWidth / 2;
      const distance = Math.abs(centerX - childCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }
    const newValue = min + closestIndex * step;
    if (newValue !== value) {
      onChange(newValue);
    }
  };

  // Debounce scroll end to trigger haptics
  const scrollTimeout = useRef<number | null>(null);
  const onScroll = () => {
    isDragging.current = true;
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = window.setTimeout(() => {
      isDragging.current = false;
      haptics.tap();
    }, 150);
    handleScroll();
  };

  return (
    <div className="relative w-full h-32 bg-[#141416] rounded-[20px] border border-[#2A2A2C] overflow-hidden select-none">
      {/* Center indicator */}
      <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-[#D4FF00] z-20 pointer-events-none -translate-x-1/2" />
      
      {/* Side gradients to fade out ticks */}
      <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#141416] to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#141416] to-transparent z-10 pointer-events-none" />
      
      {/* Active Value Display */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center z-20 pointer-events-none">
        <div className="text-[24px] font-bold text-white leading-none tracking-tight tabular-nums">
          {formatLabel(value)}
        </div>
        {formatSubLabel && (
          <div className="text-[12px] text-zinc-400 mt-1 font-medium">{formatSubLabel(value)}</div>
        )}
      </div>

      {/* Scrollable Ticks */}
      <div
        ref={containerRef}
        onScroll={onScroll}
        className="w-full h-full flex overflow-x-auto snap-x snap-mandatory pt-16 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{
          scrollPaddingLeft: 'calc(50% - 16px)',
          scrollPaddingRight: 'calc(50% - 16px)',
          paddingLeft: 'calc(50% - 16px)',
          paddingRight: 'calc(50% - 16px)',
        }}
      >
        {ticks.map((tick) => {
          const isMajor = tick % 10 === 0;
          return (
            <div
              key={tick}
              className="w-8 flex flex-col items-center justify-end shrink-0 snap-center pb-2"
            >
              <div className={cn(
                "w-[2px] rounded-full transition-colors",
                isMajor ? "h-5 bg-[#5A5A5C]" : "h-3 bg-[#3A3A3C]"
              )} />
              {isMajor && (
                <span className="text-[10px] text-zinc-500 mt-1 tabular-nums font-medium">
                  {tick}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
/** Engine activity level -> the exact string the profiles table stores. */
const ACTIVITY_TO_DB_LABEL = {
  sedentary: 'Sedentary',
  light: 'Light',
  moderate: 'Moderate',
  active: 'Active',
  athlete: 'Very active',
} as const;

function mapActivity(activity: ActivityLevel): DbProfile['activity_level'] {
  return ACTIVITY_TO_DB_LABEL[activity];
}

function AnimatedValue({ value, className = '' }: { value: number; className?: string }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {value.toLocaleString()}
    </motion.span>
  );
}

function ProgressDots({ step }: { step: 1 | 2 | 3 | 4 }) {
  return (
    <div className="pt-4 pb-2 flex justify-center gap-2">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
            i === step
              ? 'bg-[#D4FF00] shadow-[0_0_8px_#D4FF00]'
              : i < step ? 'bg-zinc-600' : 'bg-zinc-800'
          }`}
        />
      ))}
    </div>
  );
}

function UnitInput({ value, onChange, placeholder, unit }: {
  value: number | null;
  onChange: (next: number | null) => void;
  placeholder: string;
  unit: string;
}) {
  return (
    <div className="flex items-center bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 focus-within:border-[#D4FF00] transition-colors">
      <input
        inputMode="numeric"
        value={value ?? ''}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^0-9]/g, '');
          onChange(raw === '' ? null : Number(raw));
        }}
        placeholder={placeholder}
        className="w-full min-w-0 bg-transparent py-3 text-[15px] text-white placeholder:text-zinc-600 outline-none"
      />
      <span className="text-[12px] text-zinc-500 pl-2 shrink-0">{unit}</span>
    </div>
  );
}

function BasicsScreen({ draft, setDraft }: DraftProps) {
  const [heightMode, setHeightMode] = useState<'cm' | 'ftin'>('cm');

  useEffect(() => {
    if (draft.heightCm === null) setDraft((d) => ({ ...d, heightCm: 172 }));
    if (draft.weightKg === null) setDraft((d) => ({ ...d, weightKg: 65 }));
  }, []);

  const heightCm = draft.heightCm ?? 172;
  const weightKg = draft.weightKg ?? 65;

  const isValid =
    draft.name.trim().length > 0 &&
    draft.sex !== null &&
    draft.age !== null && draft.age >= 13 && draft.age <= 120 &&
    heightCm > 0 &&
    weightKg > 0;

  const formatFtIn = (cm: number) => {
    const totalInches = cm / 2.54;
    let ft = Math.floor(totalInches / 12);
    let inch = Math.round(totalInches - ft * 12);
    if (inch >= 12) { ft += 1; inch -= 12; }
    return `${ft}' ${inch}"`;
  };

  return (
    <div className="flex flex-col h-full min-h-0 w-full max-w-md mx-auto">
      <header className="flex-shrink-0 px-6 pt-2 pb-2">
        <ProgressDots step={draft.step} />
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white mt-4 mb-2">
          Let&apos;s get to know you
        </h1>
        <p className="text-zinc-400 text-sm mt-2">Takes 60 seconds.</p>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto px-6">
        <div className="mt-10 space-y-4 pb-10">
          <input
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="Your name"
            className={INPUT_CLASS}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-1 flex gap-1">
              {(['Male', 'Female'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setDraft((d) => ({ ...d, sex: option }))}
                  className={`flex-1 py-2 rounded-lg text-[14px] font-medium transition-colors ${
                    draft.sex === option
                      ? 'bg-[#D4FF00] text-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            <UnitInput
              value={draft.age}
              onChange={(v) => setDraft((d) => ({ ...d, age: v }))}
              placeholder="Age"
              unit="years"
            />
          </div>

          <div className="pt-2 space-y-5">
            {/* Height Scale */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[13px] font-medium text-zinc-400">Height</span>
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-0.5 flex gap-0.5">
                  {(['cm', 'ftin'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setHeightMode(mode)}
                      className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors ${
                        heightMode === mode ? 'bg-[#D4FF00] text-black' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {mode === 'cm' ? 'cm' : 'ft/in'}
                    </button>
                  ))}
                </div>
              </div>
              <ScalePicker
                value={heightCm}
                min={120}
                max={220}
                step={1}
                onChange={(v) => setDraft((d) => ({ ...d, heightCm: v }))}
                formatLabel={(v) => heightMode === 'cm' ? `${v} cm` : formatFtIn(v)}
                formatSubLabel={(v) => heightMode === 'cm' ? formatFtIn(v) : `${v} cm`}
              />
            </div>

            {/* Weight Scale */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[13px] font-medium text-zinc-400">Weight</span>
              </div>
              <ScalePicker
                value={weightKg}
                min={30}
                max={200}
                step={1}
                onChange={(v) => setDraft((d) => ({ ...d, weightKg: v }))}
                formatLabel={(v) => `${v} kg`}
                formatSubLabel={(v) => `${Math.round(v * 2.20462)} lbs`}
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="flex-shrink-0 px-6 pb-8">
        <button
          disabled={!isValid}
          onClick={() => setDraft((d) => ({ ...d, step: 2 }))}
          className={`mt-8 w-full py-4 rounded-full font-semibold text-[15px] transition-all ${
            isValid
              ? 'bg-[#D4FF00] text-black hover:brightness-110'
              : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </footer>
    </div>
  );
}

const ACTIVITY_OPTIONS: { id: ActivityLevel; label: string; desc: string; Icon: typeof Armchair }[] = [
  { id: 'sedentary', label: 'Sedentary', desc: 'Desk job, no exercise', Icon: Armchair },
  { id: 'light', label: 'Lightly active', desc: 'Light exercise 1-3 days/week', Icon: Footprints },
  { id: 'moderate', label: 'Moderately active', desc: 'Exercise 3-5 days/week', Icon: Dumbbell },
  { id: 'active', label: 'Very active', desc: 'Hard exercise 6-7 days/week', Icon: Zap },
  { id: 'athlete', label: 'Athlete', desc: 'Twice-a-day training, physical job', Icon: Flame },
];

function ActivityScreen({ draft, setDraft }: DraftProps) {
  return (
    <div className="flex flex-col h-full min-h-0 w-full max-w-md mx-auto">
      <header className="flex-shrink-0 px-[clamp(1rem,4vw,1.5rem)] pt-2 pb-[clamp(0.75rem,2dvh,1.25rem)]">
        <ProgressDots step={draft.step} />
        <h1 className="text-[clamp(1.5rem,4.5dvh,2rem)] font-semibold tracking-tight text-white mt-4 mb-2">
          How active are you?
        </h1>
        <p className="text-[clamp(0.8rem,2.2dvh,0.95rem)] text-zinc-400 leading-relaxed">
          Be honest — this changes your calorie target.
        </p>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto px-[clamp(1rem,4vw,1.5rem)]">
        <div className="flex flex-col gap-[clamp(0.3rem,1dvh,0.75rem)]">
          {ACTIVITY_OPTIONS.map((opt) => {
            const selected = draft.activity === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setDraft((d) => ({ ...d, activity: opt.id }))}
                className={`w-full flex items-center gap-[clamp(0.55rem,1.5dvh,1rem)] rounded-2xl border text-left transition-colors ${
                  selected
                    ? 'border-[#D4FF00]/50 bg-[#D4FF00]/5'
                    : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                } p-[clamp(0.5rem,1.7dvh,1rem)]`}
              >
                <div
                  className={`flex-shrink-0 rounded-xl flex items-center justify-center ${
                    selected ? 'bg-[#D4FF00]/15' : 'bg-zinc-900'
                  } w-[clamp(1.75rem,4.5dvh,2.75rem)] h-[clamp(1.75rem,4.5dvh,2.75rem)]`}
                >
                  <opt.Icon
                    className={`w-[55%] h-[55%] ${selected ? 'text-[#D4FF00]' : 'text-zinc-400'}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[clamp(0.78rem,2dvh,1rem)] leading-tight font-semibold text-white tracking-tight">
                    {opt.label}
                  </div>
                  <div className="text-[clamp(0.62rem,1.55dvh,0.85rem)] text-zinc-500 mt-0.5 leading-snug">
                    {opt.desc}
                  </div>
                </div>
                {selected && (
                  <Check className="w-5 h-5 text-[#D4FF00] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </main>

      <footer className="flex-shrink-0 px-[clamp(1rem,4vw,1.5rem)] pt-[clamp(0.6rem,1.8dvh,1rem)] pb-[max(0.75rem,env(safe-area-inset-bottom))] flex gap-3">
        <button
          onClick={() => setDraft((d) => ({ ...d, step: 1 }))}
          className="flex-1 rounded-full bg-zinc-900/60 border border-zinc-800 text-zinc-300 font-semibold py-[clamp(0.6rem,1.8dvh,0.85rem)] text-[clamp(0.85rem,2.2dvh,0.95rem)]"
        >
          Back
        </button>
        <button
          disabled={draft.activity === null}
          onClick={() => {
            const bmi = calculateBMI(draft.heightCm!, draft.weightKg!);
            const suggested = suggestGoal(bmi);
            setDraft((d) => ({
              ...d,
              step: 3,
              goalOverride: d.goalOverride ?? suggested,
            }));
          }}
          className="flex-1 rounded-full bg-[#D4FF00] text-black font-semibold py-[clamp(0.6rem,1.8dvh,0.85rem)] text-[clamp(0.85rem,2.2dvh,0.95rem)] disabled:opacity-40 flex items-center justify-center gap-2"
        >
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </footer>
    </div>
  );
}

const GOAL_OPTIONS: { id: GoalType; label: string; desc: string; Icon: typeof Target }[] = [
  { id: 'cut', label: 'Lose Fat', desc: 'Reduce body fat · 22% deficit', Icon: TrendingDown },
  { id: 'recomp', label: 'Recomp', desc: 'Lose fat and build muscle · maintenance', Icon: Target },
  { id: 'bulk', label: 'Build Muscle', desc: 'Gain muscle · 8% surplus', Icon: TrendingUp },
];

function Sheet({ open, onClose, title, children }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%', opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: '100%', opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl"
          >
            <div className="p-5 border-b border-zinc-900 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">{title}</h3>
              <button
                onClick={onClose}
                aria-label="Close"
                className="p-2 -mr-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function MacroInput({ label, value, onChange }: {
  label: string;
  value: number | null;
  onChange: (next: number | null) => void;
}) {
  return (
    <div className="flex items-center bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 focus-within:border-[#D4FF00] transition-colors">
      <span className="text-[13px] text-zinc-400 w-20 shrink-0">{label}</span>
      <input
        inputMode="numeric"
        value={value ?? ''}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^0-9]/g, '');
          onChange(raw === '' ? null : Number(raw));
        }}
        className="w-full min-w-0 bg-transparent py-3 text-[15px] text-white text-right outline-none tabular-nums"
      />
      <span className="text-[12px] text-zinc-500 pl-2 shrink-0">g</span>
    </div>
  );
}

function MacrosSheet({ open, onClose, draft, setDraft, recommended }: {
  open: boolean;
  onClose: () => void;
  recommended: { proteinG: number; fatG: number; carbsG: number };
} & DraftProps) {
  const [protein, setProtein] = useState<number | null>(null);
  const [fat, setFat] = useState<number | null>(null);
  const [carbs, setCarbs] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setProtein(draft.macroOverrides?.proteinG ?? recommended.proteinG);
    setFat(draft.macroOverrides?.fatG ?? recommended.fatG);
    setCarbs(draft.macroOverrides?.carbsG ?? recommended.carbsG);
  }, [open, draft.macroOverrides, recommended.proteinG, recommended.fatG, recommended.carbsG]);

  const calories = (protein ?? 0) * 4 + (fat ?? 0) * 9 + (carbs ?? 0) * 4;

  return (
    <Sheet open={open} onClose={onClose} title="Edit macros">
      <div className="space-y-3">
        <MacroInput label="Protein" value={protein} onChange={setProtein} />
        <MacroInput label="Fat" value={fat} onChange={setFat} />
        <MacroInput label="Carbs" value={carbs} onChange={setCarbs} />
      </div>

      <div className="mt-4 text-center text-[13px] text-zinc-400">
        = <span className="text-white font-semibold tabular-nums">{calories.toLocaleString()}</span> kcal
      </div>

      <button
        onClick={() => {
          setDraft((d) => ({ ...d, macroOverrides: null }));
          onClose();
        }}
        className="mt-4 w-full py-2 text-center text-[13px] text-zinc-500 hover:text-[#D4FF00] transition-colors"
      >
        Reset to recommended
      </button>

      <button
        onClick={() => {
          setDraft((d) => ({
            ...d,
            macroOverrides: {
              proteinG: protein ?? recommended.proteinG,
              fatG: fat ?? recommended.fatG,
              carbsG: carbs ?? recommended.carbsG,
            },
          }));
          onClose();
        }}
        className="mt-1 w-full py-3.5 rounded-full bg-[#D4FF00] text-black font-semibold text-[15px] hover:brightness-110 transition-all"
      >
        Apply
      </button>
    </Sheet>
  );
}

const DIET_OPTIONS: { id: 'veg' | 'egg' | 'nonveg'; label: string; Icon: typeof Leaf }[] = [
  { id: 'veg', label: 'Veg', Icon: Leaf },
  { id: 'egg', label: 'Egg', Icon: Egg },
  { id: 'nonveg', label: 'Non-veg', Icon: Drumstick },
];

function PlanScreen({ draft, setDraft, onConsent }: DraftProps & {
  onConsent: (commitFn: () => Promise<void>) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [macroSheetOpen, setMacroSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gainPace, setGainPace] = useState(8);
  const [cutPace, setCutPace] = useState(22);

  const input: OnboardingInput = {
    sex: draft.sex ?? 'Male',
    age: draft.age && draft.age > 0 ? draft.age : 30,
    heightCm: draft.heightCm && draft.heightCm > 0 ? draft.heightCm : 170,
    weightKg: draft.weightKg && draft.weightKg > 0 ? draft.weightKg : 70,
    activity: draft.activity ?? 'sedentary',
  };

  const goal: GoalType = draft.goalOverride ?? 'cut';
  const plan = calculatePlan(input, goal, gainPace, cutPace);
  const timeline = estimateTimeline(input, goal, plan);
  const bmi = plan.bmi;

  const displayProtein = plan.proteinG;
  const displayFat = plan.fatG;
  const displayCarbs = plan.carbsG;
  const displayCalories = plan.targetCalories;

  const goalMeta = GOAL_OPTIONS.find((option) => option.id === goal) ?? GOAL_OPTIONS[0];
  const GOAL_ICON = goalMeta.Icon;
  const GOAL_LABEL = goalMeta.label;

  const adjustmentPct = Math.abs(Math.round(plan.goalAdjustmentPct));
  const deficitLine =
    goal === 'recomp'
      ? 'at maintenance — no deficit or surplus'
      : `${goal === 'cut' ? '−' : '+'}${adjustmentPct}% ${
          goal === 'cut' ? 'from your maintenance' : 'above your maintenance'
        } (${plan.maintenance.toLocaleString()} kcal)`;

  const commit = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const protein = plan.proteinG;
      const fat = plan.fatG;
      const carbs = plan.carbsG;
      const calories = plan.targetCalories;

      const currentBf = bmi < 20 ? 15 : bmi < 25 ? 20 : bmi < 30 ? 25 : 30;
      const targetBf =
        goal === 'cut' ? Math.max(10, currentBf - 5)
        : goal === 'recomp' ? Math.max(10, currentBf - 3)
        : currentBf + 2;

      const profileRow = await profileService.upsertProfile({
        name: draft.name.trim(),
        age: draft.age!,
        gender: draft.sex!,
        height: draft.heightCm!,
        weight: draft.weightKg!,
        activity_level: mapActivity(input.activity),
        maintenance_kcal: plan.maintenance,
        protein_target: protein,
        carbs_target: carbs,
        fat_target: fat,
        dietary_preference: draft.dietaryPreference!,
        onboarding_completed: true,
      });

      const goalRow = await profileService.upsertGoal({
        goal_type: goal,
        cut_pace: goal === 'cut' ? cutPace : null,
        gain_pace: goal === 'bulk' ? gainPace : null,
        current_bf: currentBf,
        target_bf: targetBf,
        strategy: goal,
        deficit_kcal: Math.round(plan.maintenance - calories),
      });

      if (profileRow) queryClient.setQueryData(['profile'], profileRow);
      if (goalRow) queryClient.setQueryData(['goal'], goalRow);
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await queryClient.invalidateQueries({ queryKey: ['goal'] });
      syncCurrentWeekReport();

      analytics.trackEvent('Onboarding Completed', {
        goal_type: goal,
        activity_level: input.activity,
        tdee: plan.maintenance,
        calories,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({ type: 'error', message: `Could not save your plan: ${message}` });
      setSaving(false);
      throw error;
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 w-full max-w-md mx-auto">
      <header className="flex-shrink-0 px-6 pt-2 pb-2">
        <ProgressDots step={draft.step} />
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDraft((d) => ({ ...d, step: 2 }))}
            aria-label="Back to activity"
            className="p-2 -ml-2 bg-zinc-900/60 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">Your plan</h1>
            <p className="text-zinc-400 text-sm mt-1">Based on your stats.</p>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto px-6">
        {bmi < 18.5 && (
          <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div className="text-[13px] text-amber-200/90 leading-relaxed">
              Your BMI is {bmi}. Cutting further may not be ideal — consider Build Muscle instead.
              <button
                onClick={() => setDraft((d) => ({ ...d, goalOverride: 'bulk' }))}
                className="underline ml-1 hover:text-amber-100 transition-colors"
              >
                Switch to Build Muscle
              </button>
            </div>
          </div>
        )}

        <section className="mt-[clamp(0.75rem,2dvh,1.25rem)]">
          <div className="text-[clamp(0.7rem,1.8dvh,0.8rem)] uppercase tracking-wider text-zinc-500 mb-[clamp(0.4rem,1.2dvh,0.6rem)]">
            Your goal <span className="text-[#D4FF00]">*</span>
          </div>

          <div className="grid grid-cols-3 gap-[clamp(0.35rem,1dvh,0.5rem)]">
            {GOAL_OPTIONS.map((opt) => {
              const active = goal === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setDraft((d) => ({ ...d, goalOverride: opt.id }))}
                  className={`relative flex flex-col items-center justify-center gap-1 rounded-xl border py-[clamp(0.45rem,1.4dvh,0.7rem)] px-[clamp(0.25rem,1vw,0.5rem)] transition-colors ${
                    active
                      ? 'border-[#D4FF00]/60 bg-[#D4FF00]/8'
                      : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                  }`}
                >
                  {active && (
                    <div className="absolute -top-1.5 -right-1.5 bg-[#D4FF00] rounded-full p-0.5 shadow-sm border-2 border-[#0A0A0B] z-10">
                      <Check size={10} className="text-black" strokeWidth={3} />
                    </div>
                  )}
                  <opt.Icon
                    className={`w-[clamp(0.9rem,2.2dvh,1.1rem)] h-[clamp(0.9rem,2.2dvh,1.1rem)] ${
                      active ? 'text-[#D4FF00]' : 'text-zinc-400'
                    }`}
                  />
                  <span className={`text-[clamp(0.68rem,1.75dvh,0.82rem)] font-semibold tracking-tight ${
                    active ? 'text-white' : 'text-zinc-300'
                  }`}>
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-[clamp(0.4rem,1.2dvh,0.6rem)] text-[clamp(0.65rem,1.6dvh,0.78rem)] text-zinc-500 leading-snug text-center">
            {GOAL_OPTIONS.find((g) => g.id === goal)?.desc}
          </div>
        </section>

        {goal === 'cut' && (
          <section className="mt-[clamp(0.65rem,1.8dvh,1rem)]">
            <div className="text-[clamp(0.7rem,1.8dvh,0.8rem)] uppercase tracking-wider text-zinc-500 mb-[clamp(0.4rem,1.2dvh,0.6rem)]">
              Cut pace <span className="text-[#D4FF00]">*</span>
            </div>
            <div className="grid grid-cols-4 gap-[clamp(0.35rem,1dvh,0.5rem)]">
              {CUT_PACES.map((p) => {
                const active = cutPace === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCutPace(p)}
                    className={`relative flex flex-col items-center justify-center gap-1 rounded-xl border py-[clamp(0.45rem,1.4dvh,0.7rem)] px-[clamp(0.25rem,1vw,0.5rem)] transition-colors ${
                      active
                        ? 'border-[#D4FF00]/60 bg-[#D4FF00]/8'
                        : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                    }`}
                  >
                    {active && (
                      <div className="absolute -top-1.5 -right-1.5 bg-[#D4FF00] rounded-full p-0.5 shadow-sm border-2 border-[#0A0A0B] z-10">
                        <Check size={10} className="text-black" strokeWidth={3} />
                      </div>
                    )}
                    <span className={`text-[clamp(0.68rem,1.75dvh,0.82rem)] font-semibold tracking-tight ${
                      active ? 'text-white' : 'text-zinc-300'
                    }`}>
                      −{p}%
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {goal === 'bulk' && (
          <section className="mt-[clamp(0.65rem,1.8dvh,1rem)]">
            <div className="text-[clamp(0.7rem,1.8dvh,0.8rem)] uppercase tracking-wider text-zinc-500 mb-[clamp(0.4rem,1.2dvh,0.6rem)]">
              Surplus pace <span className="text-[#D4FF00]">*</span>
            </div>
            <div className="grid grid-cols-3 gap-[clamp(0.35rem,1dvh,0.5rem)]">
              {GAIN_PACES.map((p) => {
                const active = gainPace === p;
                return (
                  <button
                    key={p}
                    onClick={() => setGainPace(p)}
                    className={`relative flex flex-col items-center justify-center gap-1 rounded-xl border py-[clamp(0.45rem,1.4dvh,0.7rem)] px-[clamp(0.25rem,1vw,0.5rem)] transition-colors ${
                      active
                        ? 'border-[#D4FF00]/60 bg-[#D4FF00]/8'
                        : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                    }`}
                  >
                    {active && (
                      <div className="absolute -top-1.5 -right-1.5 bg-[#D4FF00] rounded-full p-0.5 shadow-sm border-2 border-[#0A0A0B] z-10">
                        <Check size={10} className="text-black" strokeWidth={3} />
                      </div>
                    )}
                    <span className={`text-[clamp(0.68rem,1.75dvh,0.82rem)] font-semibold tracking-tight ${
                      active ? 'text-white' : 'text-zinc-300'
                    }`}>
                      +{p}%
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section className="mt-[clamp(0.65rem,1.8dvh,1rem)]">
          <div className="flex items-center justify-between mb-[clamp(0.4rem,1.2dvh,0.6rem)]">
            <div className="text-[clamp(0.7rem,1.8dvh,0.8rem)] uppercase tracking-wider text-zinc-500">
              Select your diet type <span className="text-[#D4FF00]">*</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-[clamp(0.35rem,1dvh,0.5rem)]">
            {DIET_OPTIONS.map((opt) => {
              const active = draft.dietaryPreference === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setDraft((d) => ({ ...d, dietaryPreference: opt.id }))}
                  className={`relative flex flex-col items-center justify-center gap-1 rounded-xl border py-[clamp(0.45rem,1.4dvh,0.7rem)] px-[clamp(0.25rem,1vw,0.5rem)] transition-colors ${
                    active
                      ? 'border-[#D4FF00]/60 bg-[#D4FF00]/8'
                      : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                  }`}
                >
                  {active && (
                    <div className="absolute -top-1.5 -right-1.5 bg-[#D4FF00] rounded-full p-0.5 shadow-sm border-2 border-[#0A0A0B] z-10">
                      <Check size={10} className="text-black" strokeWidth={3} />
                    </div>
                  )}
                  <opt.Icon
                    className={`w-[clamp(0.9rem,2.2dvh,1.1rem)] h-[clamp(0.9rem,2.2dvh,1.1rem)] ${
                      active ? 'text-[#D4FF00]' : 'text-zinc-400'
                    }`}
                  />
                  <span className={`text-[clamp(0.68rem,1.75dvh,0.82rem)] font-semibold tracking-tight ${
                    active ? 'text-white' : 'text-zinc-300'
                  }`}>
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="mt-[clamp(0.75rem,2dvh,1.25rem)] rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-[clamp(0.5rem,1.4dvh,1rem)] relative">
          <div className="flex items-center justify-between mb-[clamp(0.4rem,1.2dvh,0.6rem)]">
            <div className="text-[clamp(0.65rem,1.7dvh,0.78rem)] uppercase tracking-wider text-[#D4FF00]/80 font-semibold">
              Your daily targets
            </div>
            <button
              onClick={() => setMacroSheetOpen(true)}
              className="text-[clamp(0.65rem,1.65dvh,0.78rem)] text-zinc-500 hover:text-white transition-colors"
            >
              Adjust ›
            </button>
          </div>

          <div className="flex items-baseline gap-1.5">
            <AnimatedValue
              value={displayCalories}
              className="text-[clamp(2rem,7dvh,2.75rem)] font-semibold tabular-nums tracking-tight text-white leading-none"
            />
            <span className="text-[clamp(0.8rem,2.2dvh,1rem)] text-zinc-500 font-medium">kcal</span>
          </div>

          <div className="mt-0.5 text-[clamp(0.68rem,1.75dvh,0.8rem)] text-zinc-500 tabular-nums">
            {deficitLine}
          </div>

          <div className="grid grid-cols-3 gap-[clamp(0.4rem,1.2dvh,0.6rem)] mt-[clamp(0.4rem,1.1dvh,0.75rem)]">
            {[
              { label: 'Protein', value: displayProtein },
              { label: 'Fat', value: displayFat },
              { label: 'Carbs', value: displayCarbs },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-xl border border-zinc-800 bg-black/20 py-[clamp(0.4rem,1.2dvh,0.6rem)] text-center"
              >
                <div className="text-[clamp(0.95rem,2.6dvh,1.15rem)] font-semibold tabular-nums text-white leading-none">
                  <AnimatedValue value={m.value} />g
                </div>
                <div className="mt-1 text-[clamp(0.58rem,1.5dvh,0.68rem)] uppercase tracking-wider text-zinc-500">
                  {m.label}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-[clamp(0.4rem,1.1dvh,0.75rem)] pt-[clamp(0.35rem,1dvh,0.6rem)] border-t border-zinc-800/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-[clamp(0.7rem,1.8dvh,0.82rem)] text-zinc-300 font-medium">
              <GOAL_ICON className="w-[clamp(0.8rem,2dvh,0.95rem)] h-[clamp(0.8rem,2dvh,0.95rem)] text-[#D4FF00]" />
              {GOAL_LABEL}
            </div>
            <div className="flex items-center gap-1.5 text-[clamp(0.65rem,1.65dvh,0.78rem)] text-zinc-500 tabular-nums">
              <Calendar className="w-[clamp(0.7rem,1.8dvh,0.85rem)] h-[clamp(0.7rem,1.8dvh,0.85rem)] shrink-0" />
              <span>
                {timeline.weeksToGoal !== null && timeline.estimatedGoalDate
                  ? `In ~${timeline.weeksToGoal} weeks · Goal by ${formatIsoDate(timeline.estimatedGoalDate)}`
                  : 'Maintain weight · Recomp mode'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/science')}
          className="mt-[clamp(0.5rem,1.4dvh,0.75rem)] w-full flex items-center justify-center gap-1.5 py-[clamp(0.45rem,1.3dvh,0.65rem)] rounded-xl border border-[#D4FF00]/25 bg-[#D4FF00]/5 text-[clamp(0.72rem,1.85dvh,0.85rem)] font-semibold text-[#D4FF00] hover:bg-[#D4FF00]/10 transition-colors"
        >
          <ShieldCheck className="w-[1em] h-[1em]" />
          Check the facts
          <span className="opacity-60">›</span>
        </button>
      </main>

      <footer className="flex-shrink-0 px-6 pb-8">
        <button
          disabled={!draft.dietaryPreference || saving}
          onClick={() => onConsent(commit)}
          className={`mt-3 w-full py-4 rounded-full font-semibold text-[15px] transition-all ${
            draft.dietaryPreference && !saving
              ? 'bg-[#D4FF00] text-black hover:brightness-110'
              : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
          }`}
        >
          {saving ? 'Saving…' : 'Start tracking →'}
        </button>
      </footer>

      <MacrosSheet
        open={macroSheetOpen}
        onClose={() => setMacroSheetOpen(false)}
        draft={draft}
        setDraft={setDraft}
        recommended={{ proteinG: plan.proteinG, fatG: plan.fatG, carbsG: plan.carbsG }}
      />
    </div>
  );
}

export function OnboardingPage() {
  const { session } = useAuthSession();
  const navigate = useNavigate();
  const userId = session?.user.id ?? '';
  const { draft, setDraft, clearDraft, isLoading } = useOnboardingDraft(userId);

  // Holds the commit function from PlanScreen so the ConsentScreen's
  // "Continue" button can invoke it after consent is granted.
  const commitRef = useRef<(() => Promise<void>) | null>(null);

  if (isLoading || !draft || !userId) return <ScreenSkeleton />;

  return (
    <div className="h-[100dvh] min-h-0 bg-[#0A0A0B] text-zinc-50 font-sans flex flex-col">
      <div className="flex-1 min-h-0 flex flex-col">
        {draft.step === 1 && <BasicsScreen draft={draft} setDraft={setDraft} />}
        {draft.step === 2 && <ActivityScreen draft={draft} setDraft={setDraft} />}
        {draft.step === 3 && (
          <PlanScreen
            draft={draft}
            setDraft={setDraft}
            onConsent={(commitFn) => {
              commitRef.current = commitFn;
              setDraft((d) => ({ ...d, step: 4 }));
            }}
          />
        )}
        {draft.step === 4 && (
          <ConsentScreen
            draft={draft}
            setDraft={setDraft}
            onFinish={async () => {
              if (commitRef.current) {
                await commitRef.current();
              }
              clearDraft();
              navigate('/dashboard', { replace: true });
            }}
          />
        )}
      </div>
    </div>
  );
}