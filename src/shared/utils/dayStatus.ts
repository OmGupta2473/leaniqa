export type GoalType = 'cut' | 'recomp' | 'bulk';

export type MetricStatus = 'met' | 'close' | 'far';

export function classifyMetric(
  goalType: GoalType,
  actual: number,
  target: number,
  kind: 'calories' | 'protein'
): MetricStatus {
  if (target <= 0 || actual <= 0) return 'far';
  if (actual < 0) return 'far';

  if (kind === 'calories') {
    switch (goalType) {
      case 'cut': {
        if (actual <= target) return 'met';
        if (actual <= target * 1.10) return 'close';
        return 'far';
      }
      case 'bulk': {
        if (actual >= target) return 'met';
        if (actual >= target * 0.90) return 'close';
        return 'far';
      }
      case 'recomp': {
        const diff = Math.abs(actual - target);
        if (diff <= 100) return 'met';
        if (diff <= 150) return 'close';
        return 'far';
      }
    }
  }

  if (kind === 'protein') {
    if (actual >= target) return 'met';
    if (actual >= target * 0.90) return 'close';
    return 'far';
  }

  return 'far';
}

export function classifyDay(
  goalType: GoalType,
  metric: {
    actual_calories: number;
    target_calories: number;
    actual_protein: number;
    target_protein: number;
  }
): MetricStatus {
  const calStatus = classifyMetric(goalType, metric.actual_calories, metric.target_calories, 'calories');
  const proStatus = classifyMetric(goalType, metric.actual_protein, metric.target_protein, 'protein');

  if (calStatus === 'far' || proStatus === 'far') return 'far';
  if (calStatus === 'close' || proStatus === 'close') return 'close';
  return 'met';
}

export function colorForDayStatus(status: MetricStatus): string {
  switch (status) {
    case 'met':
      return '#D4FF00';
    case 'close':
      return '#fbbf24';
    case 'far':
      return '#FF4D1C';
  }
}