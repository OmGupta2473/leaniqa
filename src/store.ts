import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  currentScreen: string;
  setScreen: (screen: string) => void;
  clearStore: () => void;
  onboardingData?: any;
  setOnboardingData: (data: any) => void;
  onboardingCompleted: boolean;
  setOnboardingCompleted: (completed: boolean) => void;
  goalSetCompleted: boolean;
  setGoalSetCompleted: (completed: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentScreen: 'onboard',
      setScreen: (screen) => set({ currentScreen: screen }),
      clearStore: () => set({ currentScreen: 'onboard', onboardingData: undefined, onboardingCompleted: false, goalSetCompleted: false }),
      setOnboardingData: (data) => set({ onboardingData: data }),
      onboardingCompleted: false,
      setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),
      goalSetCompleted: false,
      setGoalSetCompleted: (completed) => set({ goalSetCompleted: completed }),
    }),
    {
      name: 'physique-nav',
      partialize: (state) => ({ 
        currentScreen: state.currentScreen, 
        onboardingData: state.onboardingData, 
        onboardingCompleted: state.onboardingCompleted,
        goalSetCompleted: state.goalSetCompleted 
      }),
    }
  )
);
