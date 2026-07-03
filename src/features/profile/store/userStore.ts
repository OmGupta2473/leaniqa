import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createPersistConfig } from '@/shared/utils/store';

export interface DraftProfile {
  name: string;
  age: string;
  weight: string;
  height: string;
  gender: 'Male' | 'Female' | '';
  activity: string;
}

export interface UserState {
  onboardingData?: any;
  setOnboardingData: (data: any) => void;
  
  temporaryOnboardingValues: any;
  setTemporaryOnboardingValues: (values: any) => void;

  editProfileMode: boolean;
  setEditProfileMode: (isEdit: boolean) => void;

  goalWizardCurrentBfMid: number | null;
  setGoalWizardCurrentBfMid: (val: number | null) => void;
  
  goalWizardTargetBfMid: number | null;
  setGoalWizardTargetBfMid: (val: number | null) => void;

  draftProfile: DraftProfile | null;
  setDraftProfile: (draft: DraftProfile | null) => void;
  updateDraftProfile: (updates: Partial<DraftProfile>) => void;
  
  profileEditState: 'summary' | 'form' | 'reset';
  setProfileEditState: (state: 'summary' | 'form' | 'reset') => void;

  clearUserStore: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      onboardingData: undefined,
      setOnboardingData: (onboardingData) => set({ onboardingData }),

      temporaryOnboardingValues: {},
      setTemporaryOnboardingValues: (temporaryOnboardingValues) => set((state) => ({ 
        temporaryOnboardingValues: { ...state.temporaryOnboardingValues, ...temporaryOnboardingValues } 
      })),

      editProfileMode: false,
      setEditProfileMode: (editProfileMode) => set({ editProfileMode }),

      goalWizardCurrentBfMid: null,
      setGoalWizardCurrentBfMid: (goalWizardCurrentBfMid) => set({ goalWizardCurrentBfMid }),
      
      goalWizardTargetBfMid: null,
      setGoalWizardTargetBfMid: (goalWizardTargetBfMid) => set({ goalWizardTargetBfMid }),

      draftProfile: {
        name: '', age: '', weight: '', height: '', gender: '', activity: ''
      },
      setDraftProfile: (draftProfile) => set({ draftProfile }),
      updateDraftProfile: (updates) => set((state) => ({ 
        draftProfile: state.draftProfile ? { ...state.draftProfile, ...updates } : { name: '', age: '', weight: '', height: '', gender: '', activity: '', ...updates } as DraftProfile 
      })),
      
      profileEditState: 'summary',
      setProfileEditState: (profileEditState) => set({ profileEditState }),

      clearUserStore: () => set({ 
        onboardingData: undefined, 
        temporaryOnboardingValues: {},
        editProfileMode: false, 
        goalWizardCurrentBfMid: null,
        goalWizardTargetBfMid: null,
        draftProfile: null,
        profileEditState: 'summary'
      }),
    }),
    createPersistConfig('leaniqa-user-store', (state) => ({
      onboardingData: state.onboardingData,
      temporaryOnboardingValues: state.temporaryOnboardingValues,
      goalWizardCurrentBfMid: state.goalWizardCurrentBfMid,
      goalWizardTargetBfMid: state.goalWizardTargetBfMid,
      draftProfile: state.draftProfile,
      profileEditState: state.profileEditState
    }))
  )
);
