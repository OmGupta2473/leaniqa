import React, { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { profileService } from "../services/profileService";
import { computeProjection } from "@/shared/utils/projectionEngine";
import { haptics } from "@/shared/utils/haptics";
import {
  computePacePlan,
  CUT_PACES,
  GAIN_PACES,
  type CutPace,
  type GainPace,
} from "@/shared/utils/paceEngine";
import { deriveCarbsFromKcal } from "@/shared/utils/macroReconciliation";

interface EditNutritionModalProps {
  isOpen: boolean;
  onClose: () => void;
  calculatedData: any;
  weightKg: number;
  goalType: "cut" | "recomp" | "bulk";
  maintenanceKcal: number;
  currentCutPace: number | null;
  currentGainPace: number | null;
}

const INPUT_CLASS =
  "w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-[clamp(0.75rem,2dvh,1rem)] py-[clamp(0.5rem,1.5dvh,0.75rem)] text-[clamp(0.85rem,2.2dvh,0.95rem)] text-white placeholder:text-zinc-600 focus:border-[#D4FF00] outline-none transition-colors";

const LABEL_CLASS =
  "text-[clamp(0.65rem,1.75dvh,0.78rem)] uppercase tracking-wider text-zinc-500 mb-[clamp(0.4rem,1.2dvh,0.6rem)]";

export function EditNutritionModal({
  isOpen,
  onClose,
  calculatedData,
  weightKg,
  goalType,
  maintenanceKcal,
  currentCutPace,
  currentGainPace,
}: EditNutritionModalProps) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <EditNutritionModalInner
          onClose={onClose}
          calculatedData={calculatedData}
          weightKg={weightKg}
          goalType={goalType}
          maintenanceKcal={maintenanceKcal}
          currentCutPace={currentCutPace}
          currentGainPace={currentGainPace}
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
  currentCutPace,
  currentGainPace,
}: Omit<EditNutritionModalProps, "isOpen">) {
  const queryClient = useQueryClient();

  const [calories, setCalories] = useState(
    String(calculatedData?.dailyCalorieGoal ?? ""),
  );
  const [protein, setProtein] = useState(
    String(calculatedData?.targetMacros?.protein ?? ""),
  );
  const [fat, setFat] = useState(
    String(calculatedData?.targetMacros?.fat ?? ""),
  );
  const [pace, setPace] = useState<CutPace | null>(null);
  const [gainPace, setGainPace] = useState<GainPace>(
    currentGainPace && GAIN_PACES.includes(currentGainPace as GainPace)
      ? (currentGainPace as GainPace)
      : 8,
  );

  const pacePlan = useMemo(() => {
    if (goalType !== "cut") return null;
    if (!weightKg || !maintenanceKcal) return null;
    try {
      return computePacePlan({ weightKg, maintenanceKcal, pace });
    } catch {
      return null;
    }
  }, [goalType, weightKg, maintenanceKcal, pace]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const parsedCalories = parseInt(calories, 10) || 0;
  const parsedProtein = parseInt(protein, 10) || 0;
  const parsedFat = parseInt(fat, 10) || 0;

  const derived = useMemo(
    () => deriveCarbsFromKcal(parsedCalories, parsedProtein, parsedFat),
    [parsedCalories, parsedProtein, parsedFat],
  );

  const deviation = parsedCalories - maintenanceKcal;
  const deviationThreshold = Math.max(150, Math.round(maintenanceKcal * 0.05));
  const showDeviationBanner =
    goalType !== "cut" &&
    maintenanceKcal > 0 &&
    Math.abs(deviation) >= deviationThreshold;

  const isValid =
    goalType === "cut"
      ? pacePlan != null
      : parsedCalories >= 500 && parsedCalories <= 10000 && derived.feasible;

  const preview = useMemo(() => {
    if (!maintenanceKcal || !weightKg) return null;
    const dailyCalTarget =
      goalType === "cut" && pacePlan
        ? pacePlan.targetKcal
        : goalType === "bulk"
          ? Math.round(maintenanceKcal * (1 + (gainPace ?? 8) / 100))
          : parsedCalories;
    if (!dailyCalTarget) return null;
    try {
      return computeProjection({
        weightKg,
        targetWeightKg: null,
        goalType,
        dailyCalorieTarget: dailyCalTarget,
        maintenanceKcal,
      });
    } catch {
      return null;
    }
  }, [parsedCalories, weightKg, goalType, maintenanceKcal, pacePlan, gainPace]);

  const previewText = useMemo(() => {
    if (!preview) return "Adjust a value to see impact";
    if (preview.weeklyChangeKg < 0) {
      return `Lose ~${Math.abs(preview.weeklyChangeKg).toFixed(2)} kg/week at this target`;
    }
    if (preview.weeklyChangeKg > 0) {
      return `Gain ~${preview.weeklyChangeKg.toFixed(2)} kg/week at this target`;
    }
    if (goalType === "recomp") {
      return "Maintain weight while recomposing at this target";
    }
    return "Maintain weight at this target";
  }, [preview, goalType]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (goalType === "cut") {
        if (!pacePlan) {
          throw new Error("Cannot save: pace plan is not available");
        }
        await Promise.all([
          profileService.upsertProfile({
            target_kcal: pacePlan.targetKcal,
            protein_target: pacePlan.proteinG,
            fat_target: pacePlan.fatG,
            carbs_target: pacePlan.carbsG,
          }),
          profileService.upsertGoal({
            cut_pace: pacePlan.pace,
            deficit_kcal: pacePlan.deficitKcal,
          }),
        ]);
      } else {
        if (!derived.feasible) {
          throw new Error(
            "Macro split is infeasible — protein and fat exceed the calorie target",
          );
        }
        await profileService.upsertProfile({
          target_kcal: parsedCalories,
          protein_target: parsedProtein,
          fat_target: parsedFat,
          carbs_target: derived.carbsG,
        });
        if (goalType === "bulk") {
          await profileService.upsertGoal({ gain_pace: gainPace });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["goal"] });
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
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col max-h-[92dvh] w-full max-w-[460px] rounded-t-[28px] sm:rounded-[28px] border border-zinc-800/60 bg-[#0F0F10]/95 backdrop-blur-2xl shadow-[0_8px_60px_rgba(0,0,0,0.6)]"
      >
        <div className="flex items-center justify-between px-[clamp(1rem,4vw,1.5rem)] pt-[clamp(1rem,2.6dvh,1.5rem)] pb-[clamp(0.75rem,2dvh,1.25rem)] border-b border-zinc-900/60 flex-shrink-0">
          <h2 className="text-[clamp(1.1rem,3dvh,1.35rem)] font-semibold text-white">
            Edit nutrition
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full bg-zinc-900/60 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-[clamp(1rem,4vw,1.5rem)] py-[clamp(0.75rem,2dvh,1.25rem)] space-y-[clamp(0.75rem,2dvh,1.25rem)]">
          {goalType === "cut" ? (
            <>
              <section>
                <div className={LABEL_CLASS}>Pace</div>
                <div className="grid grid-cols-4 gap-2">
                  {CUT_PACES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPace(p)}
                      className={`py-2 rounded-xl text-[13px] font-medium transition-colors ${
                        pace === p
                          ? "bg-[#D4FF00] text-black"
                          : "bg-zinc-900/60 border border-zinc-800 text-zinc-400"
                      }`}
                    >
                      −{p}%
                    </button>
                  ))}
                </div>
              </section>

              {pacePlan && (
                <section>
                  <div className={LABEL_CLASS}>Your target</div>
                  <div className="text-[clamp(1.3rem,4dvh,1.6rem)] font-bold tabular-nums text-white">
                    {pacePlan.targetKcal}
                    <span className="text-[0.7em] text-zinc-500 font-medium ml-1">
                      kcal
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="rounded-xl bg-zinc-800/50 border border-zinc-800 px-2 py-2 text-center">
                      <div className="text-[clamp(0.7rem,1.5dvh,0.9rem)] font-semibold tabular-nums text-white">
                        {pacePlan.proteinG}g
                      </div>
                    </div>
                    <div className="rounded-xl bg-zinc-800/50 border border-zinc-800 px-2 py-2 text-center">
                      <div className="text-[clamp(0.7rem,1.5dvh,0.9rem)] font-semibold tabular-nums text-white">
                        {pacePlan.fatG}g
                      </div>
                    </div>
                    <div className="rounded-xl bg-zinc-800/50 border border-zinc-800 px-2 py-2 text-center">
                      <div className="text-[clamp(0.7rem,1.5dvh,0.9rem)] font-semibold tabular-nums text-white">
                        {pacePlan.carbsG}g
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-[clamp(0.65rem,1.65dvh,0.75rem)] text-zinc-500">
                    Deficit: {pacePlan.deficitKcal} kcal/day
                  </div>
                </section>
              )}
            </>
          ) : (
            <>
              <section>
                <div className={LABEL_CLASS}>Daily calories</div>
                <input
                  value={calories}
                  onChange={(e) =>
                    setCalories(e.target.value.replace(/[^0-9]/g, ""))
                  }
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
                    onChange={(e) =>
                      setProtein(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    placeholder="Protein (g)"
                    inputMode="numeric"
                    className={INPUT_CLASS}
                  />
                  <input
                    value={fat}
                    onChange={(e) =>
                      setFat(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    placeholder="Fat (g)"
                    inputMode="numeric"
                    className={INPUT_CLASS}
                  />
                </div>
                <div className="mt-3">
                  <div className="text-[clamp(0.65rem,1.75dvh,0.78rem)] uppercase tracking-wider text-zinc-500 mb-2">
                    Carbs (derived from remaining calories)
                  </div>
                  <div className="flex items-center justify-between bg-zinc-900/30 border border-zinc-800/60 rounded-xl px-[clamp(0.75rem,2dvh,1rem)] py-[clamp(0.5rem,1.5dvh,0.75rem)]">
                    <span className="text-[clamp(0.85rem,2.2dvh,0.95rem)] text-zinc-300 tabular-nums">
                      {derived.carbsG}
                    </span>
                    <span className="text-[clamp(0.7rem,1.8dvh,0.82rem)] text-zinc-500">
                      g
                    </span>
                  </div>
                </div>
              </section>
            </>
          )}

          <section className="rounded-xl border border-[#D4FF00]/20 bg-[#D4FF00]/5 p-[clamp(0.6rem,1.6dvh,0.9rem)]">
            <div className="text-[clamp(0.65rem,1.65dvh,0.75rem)] uppercase tracking-wider text-[#D4FF00]/80 mb-1">
              Projected impact
            </div>
            <div className="text-[clamp(0.75rem,2dvh,0.9rem)] text-white leading-snug">
              {previewText}
            </div>
          </section>

          {goalType !== "cut" && !derived.feasible && (
            <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-[clamp(0.6rem,1.6dvh,0.9rem)]">
              <div className="text-[clamp(0.75rem,2dvh,0.9rem)] text-amber-300 leading-snug">
                Protein and fat alone exceed your calorie target. Lower one of
                them or raise the target.
              </div>
            </section>
          )}

          {goalType === "bulk" && (
    <section>
      <div className={LABEL_CLASS}>Gain pace</div>
      <div className="grid grid-cols-3 gap-2">
        {GAIN_PACES.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setGainPace(p)}
            className={`py-2 rounded-xl text-[13px] font-medium transition-colors ${
              gainPace === p
                ? "bg-[#D4FF00] text-black"
                : "bg-zinc-900/60 border border-zinc-800 text-zinc-400"
            }`}
          >
            +{p}%
          </button>
        ))}
      </div>
    </section>
  )}
          {showDeviationBanner && (
            <section className="mt-3 rounded-xl border border-[#D4FF00]/20 bg-[#D4FF00]/5 p-[clamp(0.6rem,1.6dvh,0.9rem)]">
              <div className="text-[clamp(0.75rem,2dvh,0.9rem)] text-zinc-300 leading-snug">
                {deviation < 0 ? (
                  <>
                    This target is{" "}
                    <span className="text-white font-semibold tabular-nums">
                      {Math.abs(deviation)}
                    </span>{" "}
                    kcal below maintenance. It projects to about{" "}
                    <span className="text-white font-semibold tabular-nums">
                      {Math.abs(preview?.weeklyChangeKg ?? 0).toFixed(2)}
                    </span>{" "}
                    kg/week of weight loss. Your goal remains{" "}
                    <span className="text-[#D4FF00] font-medium">
                      {goalType === "recomp" ? "Recomp" : "Bulk"}
                    </span>
                    , but this calorie target creates a deficit.
                  </>
                ) : (
                  <>
                    This target is{" "}
                    <span className="text-white font-semibold tabular-nums">
                      {Math.abs(deviation)}
                    </span>{" "}
                    kcal above maintenance. It projects to about{" "}
                    <span className="text-white font-semibold tabular-nums">
                      {(preview?.weeklyChangeKg ?? 0).toFixed(2)}
                    </span>{" "}
                    kg/week of weight gain. Your goal remains{" "}
                    <span className="text-[#D4FF00] font-medium">
                      {goalType === "recomp" ? "Recomp" : "Bulk"}
                    </span>
                    , but this calorie target creates a surplus.
                  </>
                )}
              </div>
            </section>
          )}
        </div>

        <div className="flex-shrink-0 px-[clamp(1rem,4vw,1.5rem)] pt-[clamp(0.6rem,1.6dvh,0.9rem)] pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-zinc-900/60">
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!isValid || isSaving}
            className="w-full py-[clamp(0.7rem,2dvh,0.95rem)] rounded-full bg-[#D4FF00] text-black font-semibold text-[clamp(0.85rem,2.2dvh,0.95rem)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
