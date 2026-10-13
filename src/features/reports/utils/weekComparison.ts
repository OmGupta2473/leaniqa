import type { DbWeeklyReport } from '@/shared/types/supabase';

export type TrendDirection = 'toward' | 'away' | 'neutral' | 'unavailable' | 'limited';

export type MetricKey = 'calories' | 'protein' | 'carbs' | 'fat';

export interface MetricComparison {
  key: MetricKey;
  label: string;
  unit: string;
  accent: string;
  current: number;
  currentTarget: number;
  previous: number | null;
  deltaVsPrevious: number | null;
  deltaVsTarget: number;
  trend: TrendDirection;
}

interface MetricSpec {
  key: MetricKey;
  label: string;
  unit: string;
  accent: string;
  current: (r: DbWeeklyReport) => number;
  currentTarget: (r: DbWeeklyReport) => number;
  previous: (r: DbWeeklyReport) => number;
  previousTarget: (r: DbWeeklyReport) => number;
}

const SPECS: MetricSpec[] = [
  {
    key: 'calories',
    label: 'Avg Calories',
    unit: 'kcal',
    accent: '#FF4D1C',
    current: (r) => r.avg_calories,
    currentTarget: (r) => r.target_calories,
    previous: (r) => r.avg_calories,
    previousTarget: (r) => r.target_calories,
  },
  {
    key: 'protein',
    label: 'Avg Protein',
    unit: 'g',
    accent: '#378ADD',
    current: (r) => r.avg_protein_g,
    currentTarget: (r) => r.target_protein_g,
    previous: (r) => r.avg_protein_g,
    previousTarget: (r) => r.target_protein_g,
  },
  {
    key: 'carbs',
    label: 'Avg Carbs',
    unit: 'g',
    accent: '#D4FF00',
    current: (r) => r.avg_carbs_g,
    currentTarget: (r) => r.target_carbs_g,
    previous: (r) => r.avg_carbs_g,
    previousTarget: (r) => r.target_carbs_g,
  },
  {
    key: 'fat',
    label: 'Avg Fat',
    unit: 'g',
    accent: '#FFFFFF',
    current: (r) => r.avg_fat_g,
    currentTarget: (r) => r.target_fat_g,
    previous: (r) => r.avg_fat_g,
    previousTarget: (r) => r.target_fat_g,
  },
];

/**
 * Neutral dead-band: if the change in distance-from-target is smaller than
 * this fraction of the current target, we call it neutral rather than
 * implying a meaningful move.
 */
const NEUTRAL_FRACTION = 0.02;

function isLimited(report: DbWeeklyReport | null): boolean {
  if (report == null) return false;
  if (report.confidence === 'insufficient') return true;
  if (report.days_with_meals < 3) return true;
  return false;
}

function computeTrend(
  distanceCurrent: number,
  distancePrevious: number,
  currentTarget: number,
): TrendDirection {
  const delta = distancePrevious - distanceCurrent;
  const threshold = Math.abs(currentTarget) * NEUTRAL_FRACTION;
  if (Math.abs(delta) <= threshold) return 'neutral';
  return delta > 0 ? 'toward' : 'away';
}

export function buildComparisons(
  current: DbWeeklyReport,
  previous: DbWeeklyReport | null,
): MetricComparison[] {
  const comparisonLimited = isLimited(current) || isLimited(previous);

  return SPECS.map((spec) => {
    const curVal = spec.current(current);
    const curTgt = spec.currentTarget(current);

    let prevVal: number | null = null;
    let deltaVsPrevious: number | null = null;
    let trend: TrendDirection = 'unavailable';

    if (previous != null && previous.days_with_meals > 0) {
      prevVal = spec.previous(previous);
      deltaVsPrevious = curVal - prevVal;
      if (comparisonLimited) {
        trend = 'limited';
      } else {
        const prevTgt = spec.previousTarget(previous);
        const distCurrent = Math.abs(curVal - curTgt);
        const distPrevious = Math.abs(prevVal - prevTgt);
        trend = computeTrend(distCurrent, distPrevious, curTgt);
      }
    }

    return {
      key: spec.key,
      label: spec.label,
      unit: spec.unit,
      accent: spec.accent,
      current: curVal,
      currentTarget: curTgt,
      previous: prevVal,
      deltaVsPrevious,
      deltaVsTarget: curVal - curTgt,
      trend,
    };
  });
}

export function colorForTrend(trend: TrendDirection): string {
  switch (trend) {
    case 'toward': return '#D4FF00';
    case 'away': return '#FF4D1C';
    case 'neutral':
    case 'unavailable':
    case 'limited':
      return 'rgba(255,255,255,0.5)';
  }
}