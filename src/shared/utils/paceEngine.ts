/**
 * Pace engine — evidence-based calorie and macro adjustments for cut goals.
 *
 * Formula sources:
 *   - Morton et al. 2018, Br J Sports Med — protein plateau at ~1.6 g/kg
 *     bodyweight for maintenance / muscle gain
 *   - Helms et al. 2014, JISSN — 2.3–3.1 g/kg LBM recommended during a
 *     deficit for lean athletes (≈ 2.0–2.4 g/kg bodyweight)
 *   - Longland et al. 2016, Am J Clin Nutr — 2.4 g/kg bodyweight during an
 *     aggressive deficit preserved lean mass better than 1.2 g/kg
 *   - Iraki et al. 2019, Sports — fat floor ~0.5 g/kg for hormonal health
 *   - Wishnofsky 1958, Am J Clin Nutr — 7700 kcal ≈ 1 kg body fat
 *
 * Design: as the deficit gets steeper, protein (g/kg) goes UP to protect
 * muscle, fat (g/kg) goes DOWN toward a floor, and carbs absorb the rest.
 * The macros are not scaled proportionally — protein is protected.
 */

export const CUT_PACES = [22, 16, 10, 6] as const;
export type CutPace = typeof CUT_PACES[number];

export const GAIN_PACES = [8, 10, 12] as const;
export type GainPace = typeof GAIN_PACES[number];

export const MAINTENANCE_PROTEIN_G_PER_KG = 1.6;
export const MAINTENANCE_FAT_G_PER_KG = 0.9;

/**
 * Protein factor (g/kg) based on goal and pace.
 * For cut/bulk, pace-specific factor takes precedence.
 * For maintain/recomp, fixed factor applies.
 */
export function proteinFactorFor(
  goal: 'cut' | 'recomp' | 'bulk' | 'maintain',
  paceValue: number | null,
): number {
  if (goal === 'maintain') return 1.4;
  if (goal === 'recomp') return 1.8;
  if (goal === 'bulk') {
    return 1.8; // Recomp / Muscle gain always uses 1.8
  }
  // cut
  if (paceValue === 22 || paceValue === 16) return 2.2;
  return 2.0; // 10%, 6%, and fallback
}

/**
 * Fat factor (g/kg) by goal.
 */
export function fatFactorFor(
  goal: 'cut' | 'recomp' | 'bulk' | 'maintain',
): number {
  if (goal === 'cut') return 0.7;
  if (goal === 'recomp') return 0.85;
  if (goal === 'bulk') return 0.9;
  return 0.8; // maintain
}

export interface MaintenancePlan {
  maintenanceKcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
}

export interface MaintenancePlanInput {
  weightKg: number;
  maintenanceKcal: number;
}

export interface PacePlan {
  pace: CutPace;
  targetKcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  deficitKcal: number;
  /** Percent (positive number, e.g. 22 for -22%). */
  deficitPct: number;
}

export interface PacePlanInput {
  weightKg: number;
  maintenanceKcal: number;
  pace: CutPace;
}

/**
 * Compute the maintenance plan — the macros that keep the user at their
 * current weight, no cut. Used to render the "Your maintenance" card.
 *
 * Protein: 1.6 g/kg (Morton 2018 plateau)
 * Fat:     0.9 g/kg (comfortable)
 * Carbs:   the remainder after protein and fat
 */
export function computeMaintenancePlan(input: MaintenancePlanInput): MaintenancePlan {
  if (input.weightKg <= 0) throw new Error('weightKg must be positive');
  if (input.maintenanceKcal <= 0) throw new Error('maintenanceKcal must be positive');

  const proteinG = Math.round(input.weightKg * MAINTENANCE_PROTEIN_G_PER_KG);
  const fatG = Math.round(input.weightKg * MAINTENANCE_FAT_G_PER_KG);
  const remainingKcal = input.maintenanceKcal - proteinG * 4 - fatG * 9;
  const carbsG = Math.max(0, Math.round(remainingKcal / 4));

  return {
    maintenanceKcal: input.maintenanceKcal,
    proteinG,
    fatG,
    carbsG,
  };
}

/**
 * Compute the target macros for a given cut pace.
 *
 * Target calories = maintenance × (1 − pace/100)
 * Protein = weightKg × CUT_PROTEIN_G_PER_KG[pace]
 * Fat     = weightKg × CUT_FAT_G_PER_KG[pace]
 * Carbs   = remainder
 */
export function computePacePlan(input: PacePlanInput): PacePlan {
  if (input.weightKg <= 0) throw new Error('weightKg must be positive');
  if (input.maintenanceKcal <= 0) throw new Error('maintenanceKcal must be positive');
  if (!CUT_PACES.includes(input.pace)) {
    throw new Error(`pace must be one of ${CUT_PACES.join(', ')}`);
  }

  const targetKcal = Math.round(
    input.maintenanceKcal * (1 - input.pace / 100),
  );
  const proteinG = Math.min(
    Math.round(input.weightKg * proteinFactorFor('cut', input.pace)),
    Math.round(input.weightKg * 2.2),
  );
  const fatG = Math.round(Math.max(
    input.weightKg * fatFactorFor('cut'),
    (targetKcal * 0.25) / 9,
  ));
  let carbsG = Math.max(0, Math.round(
    (targetKcal - proteinG * 4 - fatG * 9) / 4
  ));
  const roundCheck = targetKcal - (proteinG * 4 + fatG * 9 + carbsG * 4);
  if (Math.abs(roundCheck) > 5) {
    carbsG = Math.max(0, carbsG + Math.round(roundCheck / 4));
  }

  return {
    pace: input.pace,
    targetKcal,
    proteinG,
    fatG,
    carbsG,
    deficitKcal: input.maintenanceKcal - targetKcal,
    deficitPct: input.pace,
  };
}
export interface GainPlan {
  targetKcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  surplusKcal: number;
  gainPace: number;
}

export interface GainPlanInput {
  weightKg: number;
  maintenanceKcal: number;
  gainPace: number;
}

export function computeGainPlan(input: GainPlanInput): GainPlan {
  if (input.weightKg <= 0) throw new Error('weightKg must be positive');
  if (input.maintenanceKcal <= 0) throw new Error('maintenanceKcal must be positive');
  if (!GAIN_PACES.includes(input.gainPace as GainPace)) {
    throw new Error(`gainPace must be one of ${GAIN_PACES.join(', ')}`);
  }

  const targetKcal = Math.round(input.maintenanceKcal * (1 + input.gainPace / 100));
  const proteinG = Math.min(
    Math.round(input.weightKg * proteinFactorFor('bulk', input.gainPace)),
    Math.round(input.weightKg * 2.2),
  );
  const fatG = Math.round(Math.max(
    input.weightKg * fatFactorFor('bulk'),
    (targetKcal * 0.25) / 9,
  ));
  let carbsG = Math.max(0, Math.round(
    (targetKcal - proteinG * 4 - fatG * 9) / 4
  ));
  const roundCheck = targetKcal - (proteinG * 4 + fatG * 9 + carbsG * 4);
  if (Math.abs(roundCheck) > 5) {
    carbsG = Math.max(0, carbsG + Math.round(roundCheck / 4));
  }

  return {
    targetKcal,
    proteinG,
    fatG,
    carbsG,
    surplusKcal: targetKcal - input.maintenanceKcal,
    gainPace: input.gainPace,
  };
}