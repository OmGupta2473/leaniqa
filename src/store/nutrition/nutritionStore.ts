import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createPersistConfig } from '../utils';

export interface NutritionState {
  // Meal Drafts & Edits
  mealDrafts: Record<string, any>;
  setMealDrafts: (drafts: Record<string, any>) => void;
  updateMealDraft: (id: string, draft: any) => void;

  currentMeal: any | null;
  setCurrentMeal: (meal: any | null) => void;
  
  selectedMealSlot: "breakfast" | "lunch" | "dinner" | null;
  setSelectedMealSlot: (slot: "breakfast" | "lunch" | "dinner" | null) => void;

  unsavedEdits: boolean;
  setUnsavedEdits: (hasEdits: boolean) => void;

  // Search & Selection
  searchText: string;
  setSearchText: (text: string) => void;

  selectedFood: any | null;
  setSelectedFood: (food: any | null) => void;

  // Filters
  mealFilters: Record<string, any>;
  setMealFilters: (filters: Record<string, any>) => void;

  // AI & Upload Progress
  aiParsingLoading: boolean;
  setAiParsingLoading: (loading: boolean) => void;
  
  aiStatus: 'unknown' | 'online' | 'offline';
  setAiStatus: (status: 'unknown' | 'online' | 'offline') => void;

  photoUploadProgress: number;
  setPhotoUploadProgress: (progress: number) => void;

  pendingUploads: string[];
  addPendingUpload: (uploadId: string) => void;
  removePendingUpload: (uploadId: string) => void;

  clearNutritionStore: () => void;
}

export const useNutritionStore = create<NutritionState>()(
  persist(
    (set) => ({
      mealDrafts: {},
      setMealDrafts: (mealDrafts) => set({ mealDrafts }),
      updateMealDraft: (id, draft) => set((state) => ({ mealDrafts: { ...state.mealDrafts, [id]: draft } })),

      currentMeal: null,
      setCurrentMeal: (currentMeal) => set({ currentMeal }),
      
      selectedMealSlot: null,
      setSelectedMealSlot: (selectedMealSlot) => set({ selectedMealSlot }),

      unsavedEdits: false,
      setUnsavedEdits: (unsavedEdits) => set({ unsavedEdits }),

      searchText: '',
      setSearchText: (searchText) => set({ searchText }),

      selectedFood: null,
      setSelectedFood: (selectedFood) => set({ selectedFood }),

      mealFilters: {},
      setMealFilters: (mealFilters) => set({ mealFilters }),

      aiParsingLoading: false,
      setAiParsingLoading: (aiParsingLoading) => set({ aiParsingLoading }),
      
      aiStatus: 'unknown',
      setAiStatus: (aiStatus) => set({ aiStatus }),

      photoUploadProgress: 0,
      setPhotoUploadProgress: (photoUploadProgress) => set({ photoUploadProgress }),

      pendingUploads: [],
      addPendingUpload: (uploadId) => set((state) => ({ pendingUploads: [...state.pendingUploads, uploadId] })),
      removePendingUpload: (uploadId) => set((state) => ({ pendingUploads: state.pendingUploads.filter(id => id !== uploadId) })),

      clearNutritionStore: () => set({
        currentMeal: null,
        selectedMealSlot: null,
        unsavedEdits: false,
        searchText: '',
        selectedFood: null,
        aiParsingLoading: false,
        aiStatus: 'unknown',
        photoUploadProgress: 0,
        pendingUploads: []
      })
    }),
    createPersistConfig('leaniqa-nutrition-store', (state) => ({
      mealDrafts: state.mealDrafts,
      mealFilters: state.mealFilters
    }))
  )
);
