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
  protein_target: number;
  created_at?: string;
}

export interface DbGoal {
  id?: string;
  user_id: string;
  current_bf: number;
  target_bf: number;
  strategy: string;
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
  meal_time: string;
  tip?: string;
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
  water: number;
  score: number;
}

export interface DbWaterLog {
  id?: string;
  user_id: string;
  amount_ml: number;
  date: string;
}

export interface DbWeeklyReport {
  id?: string;
  user_id: string;
  week_start: string;
  report: string;
}

export interface DbSubscription {
  id?: string;
  user_id: string;
  status: 'active' | 'canceled' | 'expired';
  plan: 'free' | 'beta_pro' | 'pro';
  beta_expires_at?: string;
  created_at?: string;
}
