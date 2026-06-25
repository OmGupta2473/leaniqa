import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  currentScreen: string;
  setScreen: (screen: string) => void;
  clearStore: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentScreen: 'onboard',
      setScreen: (screen) => set({ currentScreen: screen }),
      clearStore: () => set({ currentScreen: 'onboard' }),
    }),
    {
      name: 'physique-nav',
      partialize: (state) => ({ currentScreen: state.currentScreen }),
    }
  )
);
