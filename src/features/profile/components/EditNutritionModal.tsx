import React, { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { profileService } from '../services/profileService';
import { computeProjection } from '@/shared/utils/projectionEngine';
import { haptics } from '@/shared/utils/haptics';

interface EditNutritionModalProps {
  isOpen: boolean;
  onClose: () => void;
  calculatedData: any;
  weightKg: number;
  goalType: 'cut' | 'recomp' | 'bulk';
  maintenanceKcal: number;
}

const INPUT_CLASS =
  'w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-[clamp(0.75rem,2dvh,1rem)] py-[clamp(0.5rem,1.5dvh,0.75rem)] text-[clamp(0.85rem,2.2dvh,0.95rem)] text-white placeholder:text-zinc-600 focus:border-[#D4FF00] outline-none transition-colors';

const LABEL_CLASS =
  'text-[clamp(0.65rem,1.75dvh,0.78rem)] uppercase tracking-wider text-zinc-500 mb-[clamp(0.4rem,1.2dvh,0.6rem)]';

export function EditNutritionModal({
  isOpen,
  onClose,
  calculatedData,
  weightKg,
  goalType,
  maintenanceKcal,
}: EditNutritionModalProps) {
  // SSR guard (mirrors CustomMealModal) — no hooks run when there is no DOM.
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <EditNutritionModalInner
          onClose={onClose}
          calculatedData={calculatedData}
          weightKg={weightKg}
          goalType={goalType}
          maintenanceKcal={maintenanceKcal}
        />
      )}
    </AnimatePresence>,
    document.body,
  );
}

function EditNutritionModalInner({
  onClose,
  calculatedData,
  weightKg,
  goalType,
  maintenanceKcal,
}: Omit<EditNutritionModalProps, 'isOpen'>) {
  const queryClient = useQueryClient();

  const [calories, setCalories] = useState(String(calculatedData?.dailyCalorieGoal ?? ''));
  const [protein, setProtein] = useState(String(calculatedData?.targetMacros?.protein ?? ''));
  const [fat, setFat] = useState(String(calculatedData?.targetMacros?.fat ?? ''));
  const [carbs, setCarbs] = useState(String(calculatedData?.targetMacros?.carbs ?? ''));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const parsedCalories = parseInt(calories, 10) || 0;
  const parsedProtein = parseInt(protein, 10) || 0;
  const parsedFat = parseInt(fat, 10) || 0;
  const parsedCarbs = parseInt(carbs, 10) || 0;

  const macroCalories = parsedProtein * 4 + parsedFat * 9 + parsedCarbs * 4;
  const macroDiff = Math.abs(macroCalories - parsedCalories);

  const isValid = parsedCalories >= 500 && parsedCalories <= 10000;


  const preview = useMemo(() => {
    if (!parsedCalories || !maintenanceKcal || !weightKg) return null;
    try {
      return computeProjection({
        weightKg,
        targetWeightKg: null,
        goalType,
        dailyCalorieTarget: parsedCalories,
        maintenanceKcal,
      });
    } catch {
      return null;
    }
  }, [parsedCalories, weightKg, goalType, maintenanceKcal]);

  const previewText = useMemo(() => {
    if (!preview) return 'Adjust a value to see impact';
    if (goalType === 'cut') {
      return `Lose ~${Math.abs(preview.weeklyChangeKg).toFixed(2)} kg/week at this target`;
    }
    if (goalType === 'bulk') {
      return `Gain ~${preview.weeklyChangeKg.toFixed(2)} kg/week at this target`;
    }
    return 'Maintain weight while recomposing';
  }, [preview, goalType]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await profileService.upsertProfile({
        maintenance_kcal: parsedCalories,
        protein_target: parsedProtein,
        fat_target: parsedFat,
        carbs_target: parsedCarbs,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
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
          <h2 className="text-[clamp(1.1rem,3dvh,1.35rem)] font-semibold text-white">Edit nutrition</h2>
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
            <div className={LABEL_CLASS}>Daily calories</div>
            <input
              value={calories}
              onChange={(e) => setCalories(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="1700"
              inputMode="numeric"
              className={INPUT_CLASS}
            />
          </section>

          <section>
            <div className={LABEL_CLASS}>Macros</div>
            <div className="grid grid-cols-2 gap-3">
              <input
                value={protein}
                onChange={(e) => setProtein(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Protein (g)"
                inputMode="numeric"
                className={INPUT_CLASS}
              />
              <input
                value={fat}
                onChange={(e) => setFat(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Fat (g)"
                inputMode="numeric"
                className={INPUT_CLASS}
              />
            </div>
            <input
              value={carbs}
              onChange={(e) => setCarbs(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="Carbs (g)"
              inputMode="numeric"
              className={`${INPUT_CLASS} mt-3`}
            />
          </section>

          <section className="rounded-xl border border-[#D4FF00]/20 bg-[#D4FF00]/5 p-[clamp(0.6rem,1.6dvh,0.9rem)]">
            <div className="text-[clamp(0.65rem,1.65dvh,0.75rem)] uppercase tracking-wider text-[#D4FF00]/80 mb-1">
              Projected impact
            </div>
            <div className="text-[clamp(0.75rem,2dvh,0.9rem)] text-white leading-snug">
              {previewText}
            </div>
          </section>

          <section className="text-[clamp(0.7rem,1.8dvh,0.82rem)] text-zinc-500">
            Macros total: <span className="tabular-nums text-zinc-300">{macroCalories} kcal</span>
            {macroDiff > 50 && (
              <div className="mt-1 text-amber-400/80">
                Macro calories differ from target by {macroDiff} kcal
              </div>
            )}
          </section>
        </div>

        <div className="flex-shrink-0 px-[clamp(1rem,4vw,1.5rem)] pt-[clamp(0.6rem,1.6dvh,0.9rem)] pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-zinc-900/60">
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!isValid || isSaving}
            className="w-full py-[clamp(0.7rem,2dvh,0.95rem)] rounded-full bg-[#D4FF00] text-black font-semibold text-[clamp(0.85rem,2.2dvh,0.95rem)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}