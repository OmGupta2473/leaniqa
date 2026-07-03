export interface DailyActivityData {
  date: string; // YYYY-MM-DD
  caloriesConsumed: number;
  calorieTarget: number;
  proteinConsumed: number;
  proteinTarget: number;
  fatConsumed: number;
  fatTarget: number;
  carbsConsumed: number;
  carbsTarget: number;
  complianceScore: number; // 0-100
  hourlyCalories?: number[]; // length 24, optional — index 0 = 12am-1am
}

export interface RingMetric {
  label: string;
  current: number;
  goal: number;
  color: string;
}

export type ActivityView = 'dashboard' | 'detail' | 'calendar';
