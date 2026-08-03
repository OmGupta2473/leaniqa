import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createPersistConfig } from '@/shared/utils/store';

export interface AppState {
  // Theme
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  // Modals & Overlays
  activeModal: string | null;
  setActiveModal: (modalId: string | null) => void;

  // Temporary Banners
  dismissedBanners: string[];
  dismissBanner: (bannerId: string) => void;

  // UI Preferences
  reduceMotion: boolean;
  setReduceMotion: (reduce: boolean) => void;

  clearAppStore: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      activeModal: null,
      setActiveModal: (activeModal) => set({ activeModal }),

      dismissedBanners: [],
      dismissBanner: (bannerId) => set((state) => ({ 
        dismissedBanners: [...state.dismissedBanners, bannerId] 
      })),

      reduceMotion: false,
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      
      clearAppStore: () => set({
        activeModal: null,
      })
    }),
    createPersistConfig('leaniqa-app-store', (state) => ({
      theme: state.theme,
      dismissedBanners: state.dismissedBanners,
      reduceMotion: state.reduceMotion
    }))
  )
);
