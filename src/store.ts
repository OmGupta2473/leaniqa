import { create } from 'zustand';

interface AppState {
  currentScreen: string;
  setScreen: (screen: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentScreen: 'onboard',
  setScreen: (screen) => set({ currentScreen: screen }),
}));
