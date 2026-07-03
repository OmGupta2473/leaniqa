export function calculateBodyFat(
  gender: 'Male' | 'Female',
  heightCm: number,
  waistCm: number,
  neckCm: number,
  hipCm?: number
): number {
  if (gender === 'Male') {
    return 495 / (1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(heightCm)) - 450;
  } else {
    if (!hipCm) hipCm = waistCm + 10; // Fallback
    return 495 / (1.29579 - 0.35004 * Math.log10(waistCm + hipCm - neckCm) + 0.22100 * Math.log10(heightCm)) - 450;
  }
}
