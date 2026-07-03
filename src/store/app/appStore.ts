import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createPersistConfig } from '../utils';

export interface AppState {
  // Theme
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  // Modals & Overlays
  activeModal: string | null;
  setActiveModal: (modalId: string | null) => void;
  
  isDrawerOpen: boolean;
  setDrawerOpen: (isOpen: boolean) => void;

  activeBottomSheet: string | null;
  setActiveBottomSheet: (sheetId: string | null) => void;

  // Loading Overlays
  globalLoading: boolean;
  setGlobalLoading: (isLoading: boolean) => void;

  // Temporary Banners
  dismissedBanners: string[];
  dismissBanner: (bannerId: string) => void;

  // Network/Offline State
  isOffline: boolean;
  setOffline: (isOffline: boolean) => void;

  // Viewport / Screen Info
  viewport: 'mobile' | 'tablet' | 'desktop';
  setViewport: (viewport: 'mobile' | 'tablet' | 'desktop') => void;

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

      isDrawerOpen: false,
      setDrawerOpen: (isDrawerOpen) => set({ isDrawerOpen }),

      activeBottomSheet: null,
      setActiveBottomSheet: (activeBottomSheet) => set({ activeBottomSheet }),

      globalLoading: false,
      setGlobalLoading: (globalLoading) => set({ globalLoading }),

      dismissedBanners: [],
      dismissBanner: (bannerId) => set((state) => ({ 
        dismissedBanners: [...state.dismissedBanners, bannerId] 
      })),

      isOffline: typeof window !== 'undefined' ? !navigator.onLine : false,
      setOffline: (isOffline) => set({ isOffline }),

      viewport: 'mobile',
      setViewport: (viewport) => set({ viewport }),

      reduceMotion: false,
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      
      clearAppStore: () => set({
        activeModal: null,
        isDrawerOpen: false,
        activeBottomSheet: null,
        globalLoading: false,
      })
    }),
    createPersistConfig('leaniqa-app-store', (state) => ({
      theme: state.theme,
      dismissedBanners: state.dismissedBanners,
      reduceMotion: state.reduceMotion
    }))
  )
);
