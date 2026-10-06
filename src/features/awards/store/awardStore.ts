import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createPersistConfig } from '@/shared/utils/store';
import type { DbUserAward } from '@/shared/types/supabase';

export interface AwardState {
  // Durable acknowledgement flag. True when the user has at least one
  // row with acknowledged_at IS NULL. Hydrated from DB on every session.
  hasUnseenAwards: boolean;
  setHasUnseenAwards: (hasUnseen: boolean) => void;

  // In-memory queue of awards waiting to be celebrated. Rebuilt from
  // DB on every session; never persisted.
  pendingCelebrations: DbUserAward[];
  setPendingCelebrations: (awards: DbUserAward[]) => void;
  shiftPendingCelebration: () => void;
  clearPendingCelebrations: () => void;

  clearAwardStore: () => void;
}

export const useAwardStore = create<AwardState>()(
  persist(
    (set) => ({
      hasUnseenAwards: false,
      setHasUnseenAwards: (hasUnseenAwards) => set({ hasUnseenAwards }),

      pendingCelebrations: [],
      setPendingCelebrations: (pendingCelebrations) => set({ pendingCelebrations }),
      shiftPendingCelebration: () =>
        set((state) => ({ pendingCelebrations: state.pendingCelebrations.slice(1) })),
      clearPendingCelebrations: () => set({ pendingCelebrations: [] }),

      clearAwardStore: () =>
        set({
          hasUnseenAwards: false,
          pendingCelebrations: [],
        }),
    }),
    createPersistConfig('leaniqa-award-store', (state) => ({
      hasUnseenAwards: state.hasUnseenAwards,
    })),
  ),
);