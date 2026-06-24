import { create } from 'zustand';

export interface UserProfile {
  id?: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female';
  height: number;
  weight: number;
  waist?: number;
  neck?: number;
  hip?: number;
  activityLevel: 'Sedentary' | 'Light' | 'Moderate' | 'Active' | 'Very active';
  maintenanceKcal: number;
  proteinTarget: number;
  estimatedBf: number;
}

export interface PhysiqueGoal {
  currentBf: number;
  targetBf: number;
  strategy: 'Aggressive cut' | 'Recommended' | 'Slow cut';
}

export interface Meal {
  id: string;
  text: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  time: string;
}

export interface WeightLog {
  id: string;
  weight: number;
  date: string;
}

interface AppState {
  currentScreen: string;
  profile: UserProfile | null;
  goal: PhysiqueGoal | null;
  meals: Meal[];
  weightLogs: WeightLog[];
  
  setScreen: (screen: string) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  updateGoal: (goal: Partial<PhysiqueGoal>) => void;
  addMeal: (meal: Meal) => void;
  addWeightLog: (log: WeightLog) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentScreen: 'onboard',
  profile: null,
  goal: null,
  meals: [],
  weightLogs: [],
  
  setScreen: (screen) => set({ currentScreen: screen }),
  updateProfile: (updates) => set((state) => ({ 
    profile: state.profile ? { ...state.profile, ...updates } : updates as UserProfile 
  })),
  updateGoal: (updates) => set((state) => ({ 
    goal: state.goal ? { ...state.goal, ...updates } : updates as PhysiqueGoal 
  })),
  addMeal: (meal) => set((state) => ({ meals: [...state.meals, meal] })),
  addWeightLog: (log) => set((state) => ({ weightLogs: [...state.weightLogs, log] })),
}));
