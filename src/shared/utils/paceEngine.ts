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

export const CUT_PACES = [26, 22, 18, 14] as const;
export type CutPace = typeof CUT_PACES[number];

export const GAIN_PACES = [8, 10, 12] as const;
export type GainPace = typeof GAIN_PACES[number];

export const MAINTENANCE_PROTEIN_G_PER_KG = 1.6;
export const MAINTENANCE_FAT_G_PER_KG = 0.9;

/**
 * Protein g/kg bodyweight scales UP with steeper cut (muscle protection).
 * Reference values from Helms 2014 (2.0 g/kg mid-range) and Longland 2016
 * (2.4 g/kg aggressive) — tempered for non-athletes at the low end.
 * At 26% deficit: 2.4 g/kg (Longland 2016 used 2.4 at 40% deficit, so 2.4
 * at 26% is conservative). At 14% deficit: 1.8 g/kg (matches recomp baseline).
 */
export const CUT_PROTEIN_G_PER_KG: Record<CutPace, number> = {
  26: 2.4,
  22: 2.2,
  18: 2.0,
  14: 1.8,
};

/**
 * Fat g/kg bodyweight scales DOWN with steeper cut (floor ~0.5 g/kg for
 * hormone health per Iraki 2019). Kept comfortably above the floor.
 * At 26% deficit: 0.6 g/kg (Iraki 2019 floor is ~0.5 g/kg, so 0.6 is safe).
 * At 14% deficit: 0.9 g/kg (matches recomp baseline).
 */
export const CUT_FAT_G_PER_KG: Record<CutPace, number> = {
  26: 0.6,
  22: 0.7,
  18: 0.8,
  14: 0.9,
};

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
  const proteinG = Math.round(input.weightKg * CUT_PROTEIN_G_PER_KG[input.pace]);
  const fatG = Math.round(input.weightKg * CUT_FAT_G_PER_KG[input.pace]);
  const remainingKcal = targetKcal - proteinG * 4 - fatG * 9;
  const carbsG = Math.max(0, Math.round(remainingKcal / 4));

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