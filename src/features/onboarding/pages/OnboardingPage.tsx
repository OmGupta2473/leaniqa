import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle, Armchair, ArrowLeft, ArrowRight, Calendar, Check, Dumbbell,
  Flame, Footprints, Sliders, Target, TrendingDown, TrendingUp, X, Zap,
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
import { useOnboardingDraft } from '../useOnboardingDraft';
import type { OnboardingDraft } from '../types';
import { useViewport } from '@/shared/styles/responsive';

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

/** Height conversions. The draft always stores centimetres; ft/in is display only. */
function cmToFtIn(cm: number): { ft: number; inch: number } {
  const totalInches = cm / 2.54;
  let ft = Math.floor(totalInches / 12);
  let inch = Math.round(totalInches - ft * 12);
  // Rounding can tip 11.6" up to 12" - carry it into the next foot.
  if (inch >= 12) {
    ft += 1;
    inch -= 12;
  }
  return { ft, inch };
}

function ftInToCm(ft: number, inch: number): number {
  return Math.round((ft * 12 + inch) * 2.54 * 10) / 10;
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

function ProgressDots({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="pt-8 pb-4 flex justify-center gap-2">
      {[1, 2, 3].map((i) => (
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
  const [ft, setFt] = useState<number | null>(null);
  const [inch, setInch] = useState<number | null>(null);

  const isValid =
    draft.name.trim().length > 0 &&
    draft.sex !== null &&
    draft.age !== null && draft.age >= 13 && draft.age <= 120 &&
    draft.heightCm !== null && draft.heightCm > 0 &&
    draft.weightKg !== null && draft.weightKg > 0;

  /** Convert the current value when switching modes so the equivalent shows at once. */
  const switchHeightMode = (next: 'cm' | 'ftin') => {
    if (next === heightMode) return;
    if (next === 'ftin') {
      if (draft.heightCm) {
        const converted = cmToFtIn(draft.heightCm);
        setFt(converted.ft);
        setInch(converted.inch);
      }
    } else if (ft !== null || inch !== null) {
      setDraft((d) => ({ ...d, heightCm: ftInToCm(ft ?? 0, inch ?? 0) }));
    }
    setHeightMode(next);
  };

  const updateFt = (value: number | null) => {
    const next = value === null ? null : Math.min(8, Math.max(0, value));
    setFt(next);
    setDraft((d) => ({ ...d, heightCm: ftInToCm(next ?? 0, inch ?? 0) }));
  };

  const updateInch = (value: number | null) => {
    const next = value === null ? null : Math.min(11, Math.max(0, value));
    setInch(next);
    setDraft((d) => ({ ...d, heightCm: ftInToCm(ft ?? 0, next ?? 0) }));
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
      <div className="mt-10 space-y-4">
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

        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Height</span>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-0.5 flex gap-0.5">
            {(['cm', 'ftin'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => switchHeightMode(mode)}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  heightMode === mode ? 'bg-[#D4FF00] text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {mode === 'cm' ? 'cm' : 'ft/in'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {heightMode === 'cm' ? (
            <UnitInput
              value={draft.heightCm}
              onChange={(v) => setDraft((d) => ({ ...d, heightCm: v }))}
              placeholder="Height"
              unit="cm"
            />
          ) : (
            <>
              <UnitInput value={ft} onChange={updateFt} placeholder="ft" unit="ft" />
              <UnitInput value={inch} onChange={updateInch} placeholder="in" unit="in" />
            </>
          )}
          <UnitInput
            value={draft.weightKg}
            onChange={(v) => setDraft((d) => ({ ...d, weightKg: v }))}
            placeholder="Weight"
            unit="kg"
          />
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
      {/* Fixed header */}
      <header className="flex-shrink-0 px-[clamp(1rem,4vw,1.5rem)] pt-2 pb-[clamp(0.75rem,2dvh,1.25rem)]">
        <ProgressDots step={draft.step} />
        <h1 className="text-[clamp(1.5rem,4.5dvh,2rem)] font-semibold tracking-tight text-white mt-4 mb-2">
          How active are you?
        </h1>
        <p className="text-[clamp(0.8rem,2.2dvh,0.95rem)] text-zinc-400 leading-relaxed">
          Be honest — this changes your calorie target.
        </p>
      </header>

      {/* Flexible middle - 5 cards */}
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

      {/* Fixed footer */}
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

/** Shared bottom-sheet chrome: portal, backdrop, spring entrance, Escape to close. */
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

  // Re-seed from the draft every time the sheet opens.
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
const DIET_OPTIONS: { id: 'veg' | 'egg' | 'nonveg'; label: string }[] = [
  { id: 'veg', label: 'Vegetarian' },
  { id: 'egg', label: 'Eggetarian' },
  { id: 'nonveg', label: 'Non-veg' },
];

function PlanScreen({ draft, setDraft, onCommit }: DraftProps & {
  /** Accepted for call-site symmetry; profileService resolves the user itself. */
  userId: string;
  onCommit: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [macroSheetOpen, setMacroSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // The engine rejects impossible input. A draft that reached screen 3 is
  // already validated, so these fallbacks are belt-and-braces only.
  const input: OnboardingInput = {
    sex: draft.sex ?? 'Male',
    age: draft.age && draft.age > 0 ? draft.age : 30,
    heightCm: draft.heightCm && draft.heightCm > 0 ? draft.heightCm : 170,
    weightKg: draft.weightKg && draft.weightKg > 0 ? draft.weightKg : 70,
    activity: draft.activity ?? 'sedentary',
  };

  const goal: GoalType = draft.goalOverride ?? 'cut';
  const plan = calculatePlan(input, goal);
  const timeline = estimateTimeline(input, goal, plan);
  const bmi = plan.bmi;

  const displayProtein = draft.macroOverrides?.proteinG ?? plan.proteinG;
  const displayFat = draft.macroOverrides?.fatG ?? plan.fatG;
  const displayCarbs = draft.macroOverrides?.carbsG ?? plan.carbsG;
  const displayCalories = draft.macroOverrides
    ? displayProtein * 4 + displayFat * 9 + displayCarbs * 4
    : plan.targetCalories;

  const goalMeta = GOAL_OPTIONS.find((option) => option.id === goal) ?? GOAL_OPTIONS[0];
  const GoalIcon = goalMeta.Icon;

  // goalAdjustmentPct already comes out of the engine in percent (e.g. -22),
  // so it is rounded here rather than multiplied again.
  const adjustmentPct = Math.abs(Math.round(plan.goalAdjustmentPct));
  const deficitLine = draft.macroOverrides
    ? `Custom macros · base maintenance ${plan.maintenance.toLocaleString()} kcal`
    : goal === 'recomp'
      ? 'at maintenance — no deficit or surplus'
      : `${goal === 'cut' ? '−' : '+'}${adjustmentPct}% ${
          goal === 'cut' ? 'from your maintenance' : 'above your maintenance'
        } (${plan.maintenance.toLocaleString()} kcal)`;

  const commit = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const protein = draft.macroOverrides?.proteinG ?? plan.proteinG;
      const fat = draft.macroOverrides?.fatG ?? plan.fatG;
      const carbs = draft.macroOverrides?.carbsG ?? plan.carbsG;
      const calories = protein * 4 + fat * 9 + carbs * 4;

      // Placeholder body-fat values: both goals columns are NOT NULL. Phase 4
      // replaces these with real optional user entry.
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
        current_bf: currentBf,
        target_bf: targetBf,
        strategy: goal,
        deficit_kcal: Math.round(plan.maintenance - calories),
      });

      // The router gate reads profile + goal through react-query with a 5 min
      // staleTime, so seed and refresh both caches before redirecting -
      // otherwise ProtectedRoute bounces the user straight back here.
      if (profileRow) queryClient.setQueryData(['profile'], profileRow);
      if (goalRow) queryClient.setQueryData(['goal'], goalRow);
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await queryClient.invalidateQueries({ queryKey: ['goal'] });

      analytics.trackEvent('Onboarding Completed', {
        goal_type: goal,
        activity_level: input.activity,
        tdee: plan.maintenance,
        calories,
      });

      onCommit();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({ type: 'error', message: `Could not save your plan: ${message}` });
    } finally {
      setSaving(false);
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

      <div className="mt-6">
        <div className="text-sm text-zinc-400 uppercase tracking-wider mb-3">What's your goal?</div>
        <div className="space-y-2">
          {GOAL_OPTIONS.map(({ id, label, desc, Icon }) => {
            const active = goal === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setDraft((d) => ({ ...d, goalOverride: id }))}
                className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                  active
                    ? 'border-[#D4FF00]/50 bg-[#D4FF00]/5'
                    : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    active ? 'bg-[#D4FF00]/15' : 'bg-zinc-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-[#D4FF00]' : 'text-zinc-400'}`} />
                </div>
                <div className="min-w-0">
                  <div className={`text-[14px] font-semibold ${active ? 'text-white' : 'text-zinc-300'}`}>
                    {label}
                  </div>
                  <div className="text-[12px] text-zinc-500">{desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-3">How do you eat?</div>
        <div className="grid grid-cols-3 gap-2">
          {DIET_OPTIONS.map(({ id, label }) => {
            const active = draft.dietaryPreference === id;
            return (
              <button
                key={id}
                onClick={() => setDraft((d) => ({ ...d, dietaryPreference: id }))}
                className={`py-2.5 rounded-xl text-[12.5px] transition-colors ${
                  active
                    ? 'bg-[#D4FF00] text-black font-semibold'
                    : 'bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#D4FF00]">
          Your daily targets
        </div>
        <div className="mt-2 flex items-end gap-2">
          <AnimatedValue value={displayCalories} className="text-5xl font-bold tabular-nums text-white" />
          <span className="text-sm text-zinc-500 mb-2">kcal</span>
        </div>
        <p className="text-[12px] text-zinc-500 mt-1 tabular-nums">{deficitLine}</p>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { label: 'Protein', value: displayProtein },
            { label: 'Fat', value: displayFat },
            { label: 'Carbs', value: displayCarbs },
          ].map((macro) => (
            <div
              key={macro.label}
              className="rounded-xl bg-zinc-950/60 border border-zinc-800/70 px-3 py-3 text-center"
            >
              <AnimatedValue
                value={macro.value}
                className="block text-lg font-semibold tabular-nums text-white"
              />
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mt-1">{macro.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-zinc-800/60 flex items-center gap-2 text-[13px] text-zinc-300">
          <GoalIcon className="w-4 h-4 text-[#D4FF00]" />
          <span>{goalMeta.label}</span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-[13px] text-zinc-500">
          <Calendar className="w-4 h-4 shrink-0" />
          <span>
            {timeline.weeksToGoal !== null && timeline.estimatedGoalDate
              ? `In ~${timeline.weeksToGoal} weeks · Goal by ${formatIsoDate(timeline.estimatedGoalDate)}`
              : 'Maintain weight · Recomp mode'}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={() => setMacroSheetOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-zinc-900/60 border border-zinc-800 text-[13px] text-zinc-300 hover:text-white transition-colors"
        >
          <Sliders className="w-4 h-4" />
          Edit macros
        </button>
      </div>

      </main>

      <footer className="flex-shrink-0 px-6 pb-8">
      <button
        disabled={!draft.dietaryPreference || saving}
        onClick={commit}
        className={`mt-8 w-full py-4 rounded-full font-semibold text-[15px] transition-all ${
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
            userId={userId}
            onCommit={() => {
              clearDraft();
              navigate('/dashboard', { replace: true });
            }}
          />
        )}
      </div>
    </div>
  );
}
