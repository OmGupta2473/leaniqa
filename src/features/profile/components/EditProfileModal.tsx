import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { profileService } from '../services/profileService';
import { calculatePlan, type ActivityLevel } from '@/shared/utils/onboardingMath';
import { computePacePlan, type CutPace, CUT_PACES } from '@/shared/utils/paceEngine';
import { deriveCarbsFromKcal } from '@/shared/utils/macroReconciliation';
import { cn } from '@/shared/utils/utils';
import { haptics } from '@/shared/utils/haptics';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: any;
  goalData: any;
}

const INPUT_CLASS =
  'w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-[clamp(0.75rem,2dvh,1rem)] py-[clamp(0.5rem,1.5dvh,0.75rem)] text-[clamp(0.85rem,2.2dvh,0.95rem)] text-white placeholder:text-zinc-600 focus:border-[#D4FF00] outline-none transition-colors';

const GROUP_LABEL_CLASS =
  'text-[clamp(0.65rem,1.75dvh,0.78rem)] uppercase tracking-wider text-zinc-500 mb-[clamp(0.4rem,1.2dvh,0.6rem)]';

const ACTIVITY_OPTIONS: { id: ActivityLevel; dbLabel: string; label: string }[] = [
  { id: 'sedentary', dbLabel: 'Sedentary', label: 'Sedentary' },
  { id: 'light', dbLabel: 'Light', label: 'Light' },
  { id: 'moderate', dbLabel: 'Moderate', label: 'Moderate' },
  { id: 'active', dbLabel: 'Active', label: 'Active' },
  { id: 'athlete', dbLabel: 'Very active', label: 'Very active' },
];

const DB_LABEL_TO_ENUM: Record<string, ActivityLevel> = {
  Sedentary: 'sedentary',
  Light: 'light',
  Moderate: 'moderate',
  Active: 'active',
  'Very active': 'athlete',
};

const DIET_OPTIONS: { id: 'veg' | 'egg' | 'nonveg'; label: string }[] = [
  { id: 'veg', label: 'Vegetarian' },
  { id: 'egg', label: 'Eggetarian' },
  { id: 'nonveg', label: 'Non-veg' },
];

function cmToFtIn(cm: number): { ft: number; inch: number } {
  const totalIn = cm / 2.54;
  const ft = Math.floor(totalIn / 12);
  const inch = Math.round(totalIn - ft * 12);
  return inch === 12 ? { ft: ft + 1, inch: 0 } : { ft, inch };
}

function ftInToCm(ft: number, inch: number): number {
  return Math.round((ft * 12 + inch) * 2.54 * 10) / 10;
}

export function EditProfileModal({ isOpen, onClose, profileData, goalData }: EditProfileModalProps) {
  // SSR guard (mirrors CustomMealModal) â€” no hooks run when there is no DOM.
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <EditProfileModalInner onClose={onClose} profileData={profileData} goalData={goalData} />
      )}
    </AnimatePresence>,
    document.body,
  );
}
function EditProfileModalInner({ onClose, profileData, goalData }: Omit<EditProfileModalProps, 'isOpen'>) {
  const queryClient = useQueryClient();

  const [name, setName] = useState(String(profileData?.name ?? ''));
  const [age, setAge] = useState(String(profileData?.age ?? ''));
  const [heightCm, setHeightCm] = useState<number | null>(profileData?.height ?? null);
  const [heightMode, setHeightMode] = useState<'cm' | 'ftin'>('cm');
  const [ft, setFt] = useState<number | null>(null);
  const [inch, setInch] = useState<number | null>(null);
  const [weight, setWeight] = useState(String(profileData?.weight ?? ''));
  const [activity, setActivity] = useState<ActivityLevel>(
    DB_LABEL_TO_ENUM[profileData?.activity_level] ?? 'moderate',
  );
  const [diet, setDiet] = useState<'veg' | 'egg' | 'nonveg' | null>(
    profileData?.dietary_preference ?? null,
  );
  const [targetWeight, setTargetWeight] = useState(
    goalData?.target_weight != null ? String(goalData.target_weight) : '',
  );
  const [targetDate, setTargetDate] = useState(
    goalData?.target_date ? String(goalData.target_date).slice(0, 10) : '',
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const switchHeightMode = (next: 'cm' | 'ftin') => {
    if (next === heightMode) return;
    if (next === 'ftin' && heightCm) {
      const c = cmToFtIn(heightCm);
      setFt(c.ft);
      setInch(c.inch);
    } else if (next === 'cm' && (ft !== null || inch !== null)) {
      setHeightCm(ftInToCm(ft ?? 0, inch ?? 0));
    }
    setHeightMode(next);
  };

  const parsedAge = parseInt(age, 10) || 0;
  const parsedWeight = parseFloat(weight) || 0;
  const parsedHeight = heightMode === 'cm' ? (heightCm ?? 0) : ftInToCm(ft ?? 0, inch ?? 0);
  const parsedTargetWeight =
    targetWeight.trim() !== '' && !Number.isNaN(Number(targetWeight))
      ? Number(targetWeight)
      : null;

  const isValid =
    name.trim().length > 0 &&
    parsedAge >= 13 && parsedAge <= 120 &&
    parsedHeight > 0 &&
    parsedWeight > 0 &&
    diet !== null;

  const goalType = (goalData?.goal_type ?? 'cut') as 'cut' | 'recomp' | 'bulk';

  // Recalculate the plan from the current form values so we know what the
  // new body stats imply for protein and fat. Only safe to compute when the
  // numeric inputs are valid.
  const recalculatedPlan =
    parsedAge >= 13 && parsedAge <= 120 && parsedHeight > 0 && parsedWeight > 0
      ? calculatePlan(
          {
            sex: (profileData?.gender ?? 'Male') as 'Male' | 'Female',
            age: parsedAge,
            heightCm: parsedHeight,
            weightKg: parsedWeight,
            activity,
          },
          goalType,
        )
      : null;

  // For non-cut goals with a preserved target_kcal, derive carbs from the
  // target plus the newly recalculated protein and fat.
  const derivedCarbs =
    goalType !== 'cut' &&
    profileData?.target_kcal != null &&
    recalculatedPlan != null
      ? deriveCarbsFromKcal(
          profileData.target_kcal,
          recalculatedPlan.proteinG,
          recalculatedPlan.fatG,
        )
      : null;

  const canSave = isValid && (derivedCarbs == null || derivedCarbs.feasible);

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Defensive: DB constraint allows only {26,22,18,14}, but legacy rows
      // could contain {16,20} from the prior migration. paceEngine has no
      // macro math for those, so fall back to the previously-defaulted 22.
      const storedPace = goalData?.cut_pace;
      const currentPace: CutPace =
        typeof storedPace === 'number' && (CUT_PACES as readonly number[]).includes(storedPace)
          ? (storedPace as CutPace)
          : 22;

      if (!recalculatedPlan) {
        throw new Error('Cannot save: profile values are incomplete');
      }

      const pacePlan = goalType === 'cut'
        ? computePacePlan({
            weightKg: parsedWeight,
            maintenanceKcal: recalculatedPlan.maintenance,
            pace: currentPace,
          })
        : null;

      const profilePayload: any = {
        name: name.trim(),
        age: parsedAge,
        gender: (profileData?.gender ?? 'Male') as 'Male' | 'Female',
        height: parsedHeight,
        weight: parsedWeight,
        activity_level: (ACTIVITY_OPTIONS.find((o) => o.id === activity)?.dbLabel ?? 'Moderate') as any,
        maintenance_kcal: recalculatedPlan.maintenance,
        protein_target: recalculatedPlan.proteinG,
        fat_target: recalculatedPlan.fatG,
        carbs_target: recalculatedPlan.carbsG,
        dietary_preference: diet,
      };

      if (pacePlan) {
        // Cut: pace plan is authoritative.
        profilePayload.target_kcal = pacePlan.targetKcal;
        profilePayload.protein_target = pacePlan.proteinG;
        profilePayload.fat_target = pacePlan.fatG;
        profilePayload.carbs_target = pacePlan.carbsG;
      } else if (derivedCarbs?.feasible) {
        // Non-cut with a preserved target_kcal: keep it, use the newly recalculated
        // protein and fat, derive carbs from the remainder.
        profilePayload.carbs_target = derivedCarbs.carbsG;
        // target_kcal is intentionally NOT written.
      }

      await profileService.upsertProfile(profilePayload);

      const goalPayload: any = {
        target_weight: parsedTargetWeight,
        target_date: targetDate?.trim() ? targetDate : null,
      };
      if (pacePlan) {
        goalPayload.cut_pace = pacePlan.pace;
        goalPayload.deficit_kcal = pacePlan.deficitKcal;
      }

      await profileService.upsertGoal(goalPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['goal'] });
      haptics.success();
      onClose();
    },
  });

  const isSaving = saveMutation.isPending;
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: 40, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.98 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col max-h-[92dvh] w-full max-w-[460px] rounded-t-[28px] sm:rounded-[28px] border border-zinc-800/60 bg-[#0F0F10]/95 backdrop-blur-2xl shadow-[0_8px_60px_rgba(0,0,0,0.6)]"
      >
        <div className="flex items-center justify-between px-[clamp(1rem,4vw,1.5rem)] pt-[clamp(1rem,2.6dvh,1.5rem)] pb-[clamp(0.75rem,2dvh,1.25rem)] border-b border-zinc-900/60 flex-shrink-0">
          <h2 className="text-[clamp(1.1rem,3dvh,1.35rem)] font-semibold text-white">Edit details</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full bg-zinc-900/60 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-[clamp(1rem,4vw,1.5rem)] py-[clamp(0.75rem,2dvh,1.25rem)] space-y-[clamp(0.75rem,2dvh,1.25rem)]">
          <section>
            <div className={GROUP_LABEL_CLASS}>Identity</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className={INPUT_CLASS}
            />
            <div className="grid grid-cols-2 gap-3 mt-3">
              <input
                value={age}
                onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Age"
                inputMode="numeric"
                className={INPUT_CLASS}
              />
              <div>
                <div className="flex gap-1 mb-2">
                  {(['cm', 'ftin'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => switchHeightMode(m)}
                      className={cn(
                        'flex-1 py-1 rounded-lg text-[11px] font-medium transition-colors',
                        heightMode === m
                          ? 'bg-[#D4FF00] text-black'
                          : 'bg-zinc-900/60 text-zinc-400',
                      )}
                    >
                      {m === 'cm' ? 'cm' : 'ft/in'}
                    </button>
                  ))}
                </div>
                {heightMode === 'cm' ? (
                  <input
                    value={heightCm ?? ''}
                    onChange={(e) => setHeightCm(parseFloat(e.target.value) || null)}
                    placeholder="Height"
                    inputMode="numeric"
                    className={INPUT_CLASS}
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={ft ?? ''}
                      onChange={(e) => setFt(parseInt(e.target.value, 10) || 0)}
                      placeholder="ft"
                      inputMode="numeric"
                      className={INPUT_CLASS}
                    />
                    <input
                      value={inch ?? ''}
                      onChange={(e) => setInch(parseInt(e.target.value, 10) || 0)}
                      placeholder="in"
                      inputMode="numeric"
                      className={INPUT_CLASS}
                    />
                  </div>
                )}
              </div>
            </div>
          </section>

          <section>
            <div className={GROUP_LABEL_CLASS}>Body</div>
            <input
              value={weight}
              onChange={(e) => setWeight(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="Weight (kg)"
              inputMode="decimal"
              className={INPUT_CLASS}
            />
            <div className="mt-3">
              <div className="text-[clamp(0.65rem,1.75dvh,0.78rem)] text-zinc-500 mb-2">Activity</div>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {ACTIVITY_OPTIONS.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setActivity(o.id)}
                    className={cn(
                      'shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors whitespace-nowrap',
                      activity === o.id
                        ? 'bg-[#D4FF00] text-black'
                        : 'bg-zinc-900/60 border border-zinc-800 text-zinc-400',
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section>
            <div className={GROUP_LABEL_CLASS}>Diet</div>
            <div className="grid grid-cols-3 gap-2">
              {DIET_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setDiet(o.id)}
                  className={cn(
                    'py-2 rounded-xl text-[13px] font-medium transition-colors',
                    diet === o.id
                      ? 'bg-[#D4FF00] text-black'
                      : 'bg-zinc-900/60 border border-zinc-800 text-zinc-400',
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className={GROUP_LABEL_CLASS}>Goal target (optional)</div>
            <div className="grid grid-cols-2 gap-3">
              <input
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="Target weight (kg)"
                inputMode="decimal"
                className={INPUT_CLASS}
              />
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </section>
        </div>

        <div className="flex-shrink-0 px-[clamp(1rem,4vw,1.5rem)] pt-[clamp(0.6rem,1.6dvh,0.9rem)] pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-zinc-900/60">
          {derivedCarbs != null && !derivedCarbs.feasible && (
            <div className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-[13px] text-amber-300 leading-relaxed">
              Protein and fat alone exceed your saved calorie target of{' '}
              {profileData.target_kcal} kcal. Lower your activity level, or adjust your
              target from the Profile page's Edit nutrition.
            </div>
          )}
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!canSave || isSaving}
            className="w-full py-[clamp(0.7rem,2dvh,0.95rem)] rounded-full bg-[#D4FF00] text-black font-semibold text-[clamp(0.85rem,2.2dvh,0.95rem)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Savingâ€¦' : 'Save changes'}
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}