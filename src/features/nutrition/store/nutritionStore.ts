import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createPersistConfig } from '@/shared/utils/store';

export interface NutritionState {
  // Meal Drafts & Edits
  mealDrafts: Record<string, any>;
  setMealDrafts: (drafts: Record<string, any>) => void;
  updateMealDraft: (id: string, draft: any) => void;
  
  selectedMealSlot: "breakfast" | "lunch" | "dinner" | null;
  setSelectedMealSlot: (slot: "breakfast" | "lunch" | "dinner" | null) => void;

  // Search & Selection
  searchText: string;
  setSearchText: (text: string) => void;

  // Filters
  mealFilters: Record<string, any>;
  setMealFilters: (filters: Record<string, any>) => void;

  // AI
  aiParsingLoading: boolean;
  setAiParsingLoading: (loading: boolean) => void;
  
  aiStatus: 'unknown' | 'online' | 'offline';
  setAiStatus: (status: 'unknown' | 'online' | 'offline') => void;

  clearNutritionStore: () => void;
}

export const useNutritionStore = create<NutritionState>()(
  persist(
    (set) => ({
      mealDrafts: {},
      setMealDrafts: (mealDrafts) => set({ mealDrafts }),
      updateMealDraft: (id, draft) => set((state) => ({ mealDrafts: { ...state.mealDrafts, [id]: draft } })),
      
      selectedMealSlot: null,
      setSelectedMealSlot: (selectedMealSlot) => set({ selectedMealSlot }),

      searchText: '',
      setSearchText: (searchText) => set({ searchText }),

      mealFilters: {},
      setMealFilters: (mealFilters) => set({ mealFilters }),

      aiParsingLoading: false,
      setAiParsingLoading: (aiParsingLoading) => set({ aiParsingLoading }),
      
      aiStatus: 'unknown',
      setAiStatus: (aiStatus) => set({ aiStatus }),

      clearNutritionStore: () => set({
        selectedMealSlot: null,
        searchText: '',
        aiParsingLoading: false,
        aiStatus: 'unknown',
      })
    }),
    createPersistConfig('leaniqa-nutrition-store', (state) => ({
      mealDrafts: state.mealDrafts,
      mealFilters: state.mealFilters
    }))
  )
);
