import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createPersistConfig } from '@/shared/utils/store';

export interface DashboardState {
  // Filters & preferences
  temporaryPreferences: Record<string, any>;
  setTemporaryPreferences: (prefs: Record<string, any>) => void;

  clearDashboardStore: () => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      temporaryPreferences: {},
      setTemporaryPreferences: (temporaryPreferences) => set((state) => ({
        temporaryPreferences: { ...state.temporaryPreferences, ...temporaryPreferences }
      })),

      clearDashboardStore: () => set({
        temporaryPreferences: {}
      }),
    }),
    createPersistConfig('leaniqa-dashboard-store', (state) => ({
      temporaryPreferences: state.temporaryPreferences
    }))
  )
);
