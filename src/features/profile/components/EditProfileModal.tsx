import React, { useState, useEffect } from 'react';
import { X, Check, Armchair, Footprints, Dumbbell, Zap, Flame, Leaf, Egg, Drumstick } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { profileService } from '../services/profileService';
import { calculatePlan, type ActivityLevel } from '@/shared/utils/onboardingMath';
import { computePacePlan, type CutPace, CUT_PACES } from '@/shared/utils/paceEngine';
import { deriveCarbsFromKcal } from '@/shared/utils/macroReconciliation';
import { cn } from '@/shared/utils/utils';
import { haptics } from '@/shared/utils/haptics';
import { syncCurrentWeekReport } from "@/features/reports/utils/syncCurrentWeek";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: any;
  goalData: any;
}

const INPUT_CLASS =
  'w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3 text-[15px] text-white placeholder:text-zinc-600 focus:border-[#D4FF00] outline-none transition-colors';

const GROUP_LABEL_CLASS =
  'text-[12px] font-medium uppercase tracking-wider text-zinc-400 mb-2';

const ACTIVITY_OPTIONS: { id: ActivityLevel; dbLabel: string; label: string; Icon: any }[] = [
  { id: 'sedentary', dbLabel: 'Sedentary', label: 'Sedentary', Icon: Armchair },
  { id: 'light', dbLabel: 'Light', label: 'Light', Icon: Footprints },
  { id: 'moderate', dbLabel: 'Moderate', label: 'Moderate', Icon: Dumbbell },
  { id: 'active', dbLabel: 'Active', label: 'Active', Icon: Zap },
  { id: 'athlete', dbLabel: 'Very active', label: 'Very active', Icon: Flame },
];

const DB_LABEL_TO_ENUM: Record<string, ActivityLevel> = {
  Sedentary: 'sedentary',
  Light: 'light',
  Moderate: 'moderate',
  Active: 'active',
  'Very active': 'athlete',
};

const DIET_OPTIONS: { id: 'veg' | 'egg' | 'nonveg'; label: string; Icon: any }[] = [
  { id: 'veg', label: 'Veg', Icon: Leaf },
  { id: 'egg', label: 'Egg', Icon: Egg },
  { id: 'nonveg', label: 'Non-veg', Icon: Drumstick },
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
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <EditProfileModalInner onClose={onClose} profileData={profileData} goalData={goalData} />
      )}
    </AnimatePresence>,
    document.body
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
        profilePayload.target_kcal = pacePlan.targetKcal;
        profilePayload.protein_target = pacePlan.proteinG;
        profilePayload.fat_target = pacePlan.fatG;
        profilePayload.carbs_target = pacePlan.carbsG;
      } else if (derivedCarbs?.feasible) {
        profilePayload.carbs_target = derivedCarbs.carbsG;
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
      syncCurrentWeekReport();
      haptics.success();
      onClose();
    },
  });

  const isSaving = saveMutation.isPending;

  return (
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
        className="relative flex flex-col max-h-[92dvh] w-full max-w-[480px] rounded-t-[32px] sm:rounded-[32px] border border-zinc-800/60 bg-[#0A0A0B] shadow-[0_8px_60px_rgba(0,0,0,0.8)]"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-zinc-900/60 flex-shrink-0">
          <h2 className="text-xl font-semibold text-white tracking-tight">Edit details</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-zinc-900/80 border border-zinc-800 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-6">
          
          {/* Identity Section */}
          <section className="space-y-3">
            <div className={GROUP_LABEL_CLASS}>Identity</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className={INPUT_CLASS}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-medium text-zinc-400 mb-1.5 block">Age</label>
                <input
                  value={age}
                  onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="e.g. 25"
                  inputMode="numeric"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[12px] font-medium text-zinc-400">Height</label>
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-0.5 flex gap-0.5">
                    {(['cm', 'ftin'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => switchHeightMode(m)}
                        className={cn(
                          'px-2.5 py-0.5 rounded-md text-[10px] font-medium transition-colors',
                          heightMode === m
                            ? 'bg-[#D4FF00] text-black'
                            : 'text-zinc-400 hover:text-white',
                        )}
                      >
                        {m === 'cm' ? 'cm' : 'ft/in'}
                      </button>
                    ))}
                  </div>
                </div>
                {heightMode === 'cm' ? (
                  <input
                    value={heightCm ?? ''}
                    onChange={(e) => setHeightCm(parseFloat(e.target.value) || null)}
                    placeholder="e.g. 175"
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

          {/* Body Section */}
          <section className="space-y-3">
            <div className={GROUP_LABEL_CLASS}>Body</div>
            <div>
              <label className="text-[12px] font-medium text-zinc-400 mb-1.5 block">Weight (kg)</label>
              <input
                value={weight}
                onChange={(e) => setWeight(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="e.g. 70"
                inputMode="decimal"
                className={INPUT_CLASS}
              />
            </div>
            
            <div className="pt-2">
              <label className="text-[12px] font-medium text-zinc-400 mb-2 block">Activity Level</label>
              <div className="grid grid-cols-2 gap-2">
                {ACTIVITY_OPTIONS.map((opt) => {
                  const active = activity === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setActivity(opt.id)}
                      className={cn(
                        'relative flex items-center gap-2 rounded-xl border py-2.5 px-3 transition-colors',
                        active
                          ? 'border-[#D4FF00]/60 bg-[#D4FF00]/8'
                          : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                      )}
                    >
                      {active && (
                        <div className="absolute -top-1.5 -right-1.5 bg-[#D4FF00] rounded-full p-0.5 shadow-sm border-2 border-[#0A0A0B] z-10">
                          <Check size={10} className="text-black" strokeWidth={3} />
                        </div>
                      )}
                      <opt.Icon className={cn('w-4 h-4 shrink-0', active ? 'text-[#D4FF00]' : 'text-zinc-400')} />
                      <span className={cn('text-[13px] font-semibold tracking-tight', active ? 'text-white' : 'text-zinc-300')}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Diet Section */}
          <section className="space-y-3">
            <div className={GROUP_LABEL_CLASS}>Dietary Preference</div>
            <div className="grid grid-cols-3 gap-2">
              {DIET_OPTIONS.map((opt) => {
                const active = diet === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDiet(opt.id)}
                    className={cn(
                      'relative flex flex-col items-center justify-center gap-1.5 rounded-xl border py-3 transition-colors',
                      active
                        ? 'border-[#D4FF00]/60 bg-[#D4FF00]/8'
                        : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                    )}
                  >
                    {active && (
                      <div className="absolute -top-1.5 -right-1.5 bg-[#D4FF00] rounded-full p-0.5 shadow-sm border-2 border-[#0A0A0B] z-10">
                        <Check size={10} className="text-black" strokeWidth={3} />
                      </div>
                    )}
                    <opt.Icon className={cn('w-5 h-5', active ? 'text-[#D4FF00]' : 'text-zinc-400')} />
                    <span className={cn('text-[13px] font-semibold tracking-tight', active ? 'text-white' : 'text-zinc-300')}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Goal Target Section */}
          <section className="space-y-3 pb-2">
            <div className={GROUP_LABEL_CLASS}>Goal Target (Optional)</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-medium text-zinc-400 mb-1.5 block">Target Weight (kg)</label>
                <input
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="e.g. 65"
                  inputMode="decimal"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-zinc-400 mb-1.5 block">Target Date</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className={INPUT_CLASS}
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-5 pt-4 pb-[max(20px,env(safe-area-inset-bottom))] border-t border-zinc-900/60 bg-[#0A0A0B]">
          {derivedCarbs != null && !derivedCarbs.feasible && (
            <div className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[12px] text-amber-300 leading-relaxed">
              Protein and fat alone exceed your saved calorie target of{' '}
              {profileData.target_kcal} kcal. Lower your activity level, or adjust your
              target from the Profile page's Edit nutrition.
            </div>
          )}
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!canSave || isSaving}
            className="w-full h-12 rounded-full bg-[#D4FF00] text-black font-semibold text-[15px] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(212,255,0,0.2)]"
          >
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}