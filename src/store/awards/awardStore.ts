import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createPersistConfig } from '../utils';

export interface AwardState {
  // Award modal / Selected award
  selectedAward: any | null;
  setSelectedAward: (award: any | null) => void;

  // Celebration queue
  celebrationQueue: any[];
  addCelebration: (award: any) => void;
  shiftCelebrationQueue: () => void;

  // Recently unlocked
  recentlyUnlocked: any[];
  setRecentlyUnlocked: (awards: any[]) => void;
  addRecentlyUnlocked: (award: any) => void;

  // Award notifications
  hasUnseenAwards: boolean;
  setHasUnseenAwards: (hasUnseen: boolean) => void;

  // Award animations
  animationsEnabled: boolean;
  setAnimationsEnabled: (enabled: boolean) => void;
  
  clearAwardStore: () => void;
}

export const useAwardStore = create<AwardState>()(
  persist(
    (set) => ({
      selectedAward: null,
      setSelectedAward: (selectedAward) => set({ selectedAward }),

      celebrationQueue: [],
      addCelebration: (award) => set((state) => ({ celebrationQueue: [...state.celebrationQueue, award] })),
      shiftCelebrationQueue: () => set((state) => ({ celebrationQueue: state.celebrationQueue.slice(1) })),

      recentlyUnlocked: [],
      setRecentlyUnlocked: (recentlyUnlocked) => set({ recentlyUnlocked }),
      addRecentlyUnlocked: (award) => set((state) => ({ recentlyUnlocked: [award, ...state.recentlyUnlocked] })),

      hasUnseenAwards: false,
      setHasUnseenAwards: (hasUnseenAwards) => set({ hasUnseenAwards }),

      animationsEnabled: true,
      setAnimationsEnabled: (animationsEnabled) => set({ animationsEnabled }),

      clearAwardStore: () => set({
        selectedAward: null,
        celebrationQueue: [],
        recentlyUnlocked: [],
        hasUnseenAwards: false
      })
    }),
    createPersistConfig('leaniqa-award-store', (state) => ({
      recentlyUnlocked: state.recentlyUnlocked,
      hasUnseenAwards: state.hasUnseenAwards,
      animationsEnabled: state.animationsEnabled
    }))
  )
);
