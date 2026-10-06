import type { AwardCategory } from '@/shared/utils/awardsEngine';

/**
 * Returns a short, honest copy string describing how far the user is
 * from unlocking an award.
 *
 * The metric differs per category:
 *   - streak:    successful days (consecutive days meeting both goals)
 *   - logging:   number of meals logged
 *   - protein:   number of days meeting the protein target
 *   - precision: number of days scoring >= 90
 *   - weight:    number of weight logs recorded
 *   - milestone: days since signup
 *
 * Never returns a date, never predicts weeks. Behavioral distance is
 * not a function of calorie pace.
 */
export function getAwardDistanceCopy(
  category: AwardCategory,
  current: number,
  target: number,
): string {
  const remaining = Math.max(0, target - current);
  if (remaining === 0) return 'Ready to unlock';

  const singular = (label: string) => `1 ${label} away`;
  const plural = (label: string) => `${remaining} ${label} away`;

  switch (category) {
    case 'streak':
      return remaining === 1 ? singular('successful day') : plural('successful days');
    case 'logging':
      return remaining === 1 ? singular('logged meal') : plural('logged meals');
    case 'protein':
      return remaining === 1 ? singular('high-protein day') : plural('high-protein days');
    case 'precision':
      return remaining === 1 ? singular('accurate day') : plural('accurate days');
    case 'weight':
      return remaining === 1 ? singular('weigh-in') : plural('weigh-ins');
    case 'milestone':
      return remaining === 1 ? singular('day') : plural('days');
    default:
      return `${remaining} to go`;
  }
}