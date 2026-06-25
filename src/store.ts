import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  currentScreen: string;
  setScreen: (screen: string) => void;
  clearStore: () => void;
  onboardingData?: any;
  setOnboardingData: (data: any) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentScreen: 'onboard',
      setScreen: (screen) => set({ currentScreen: screen }),
      clearStore: () => set({ currentScreen: 'onboard', onboardingData: undefined }),
      setOnboardingData: (data) => set({ onboardingData: data }),
    }),
    {
      name: 'physique-nav',
      partialize: (state) => ({ currentScreen: state.currentScreen, onboardingData: state.onboardingData }),
    }
  )
);
