export interface DbProfile {
  id?: string;
  email: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female';
  height: number;
  weight: number;
  waist?: number;
  neck?: number;
  hip?: number;
  activity_level: 'Sedentary' | 'Light' | 'Moderate' | 'Active' | 'Very active';
  maintenance_kcal: number;
  /** User-set daily calorie target. NULL means use calculated target from body stats + goal deficit. */
  target_kcal?: number | null;
  protein_target: number;
  carbs_target?: number;
  fat_target?: number;
  /** Onboarding v2: captured during onboarding. Null for legacy rows. */
  dietary_preference?: 'veg' | 'egg' | 'nonveg' | null;
  /** Set to true once onboarding commits (migration 20260706000000). */
  onboarding_completed?: boolean;
  created_at?: string;
}

export interface DbGoal {
  id?: string;
  user_id: string;
  current_bf: number;
  target_bf: number;
  strategy: string;
  /** Onboarding v2: required - the migration backfills legacy rows to 'cut'. */
  goal_type: 'cut' | 'recomp' | 'bulk';
  /** Onboarding v2: the user's chosen cut pace (16/18/20/22). NULL for non-cut goals. */
  cut_pace?: number | null;
  gain_pace?: number | null;
  deficit_kcal: number;
  target_date?: string;
  target_weight?: number;
  created_at?: string;
}

export interface DbMealLog {
  id?: string;
  user_id: string;
  meal_text: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber?: number;
  meal_time: string;
  tip?: string;
  meal_slot?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  client_token?: string;
}

export interface DbWeightLog {
  id?: string;
  user_id: string;
  weight: number;
  body_fat?: number;
  date: string;
}

export interface DbDailyMetric {
  id?: string;
  user_id: string;
  date: string;
  target_calories: number;
  actual_calories: number;
  target_protein: number;
  actual_protein: number;
  score: number;
}

export interface WeeklyDaySummary {
  date: string;
  dayOfWeek: number;
  logged: boolean;
  isToday: boolean;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  status: 'not_logged' | 'on_target' | 'under' | 'over' | 'protein_low' | 'in_progress';
  score: number;
}

export interface DbWeeklyReport {
  id?: string;
  user_id: string;
  week_start: string;        // YYYY-MM-DD (Sunday)
  week_end: string;          // YYYY-MM-DD (Saturday)
  status: 'live' | 'final';
  days_with_meals: number;
  days_with_weight: number;
  total_calories: number;
  avg_calories: number;
  target_calories: number;
  total_protein_g: number;
  avg_protein_g: number;
  target_protein_g: number;
  total_carbs_g: number;
  avg_carbs_g: number;
  target_carbs_g: number;
  total_fat_g: number;
  avg_fat_g: number;
  target_fat_g: number;
  weekly_score: number;
  confidence: 'empty' | 'insufficient' | 'low' | 'medium' | 'high';
  day_summaries: WeeklyDaySummary[];
  computed_at: string;
  finalized_at: string | null;
  created_at: string;
  updated_at: string;
  /** Legacy column, still present in the DB but no longer written. */
  report?: string;
}

export interface DbSubscription {
  id?: string;
  user_id: string;
  status: 'active' | 'canceled' | 'expired';
  plan: 'free' | 'beta_pro' | 'pro';
  beta_expires_at?: string;
  created_at?: string;
}

export interface DbUserStreak {
  user_id: string;
  current_streak: number;
  highest_streak: number;
  updated_at?: string;
}

export interface DbUserAward {
  id?: string;
  user_id: string;
  award_id: string;
  unlocked_at?: string;
  acknowledged_at?: string | null;
}
