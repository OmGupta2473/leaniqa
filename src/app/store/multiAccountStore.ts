import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Session } from '@supabase/supabase-js';
import { createPersistConfig } from '../shared/utils/store';

export interface SavedAccount {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  session: Session;
  updated_at: number;
}

interface MultiAccountState {
  accounts: Record<string, SavedAccount>;
  activeAccountId: string | null;
  
  // Update an existing saved account, or just track active session
  updateSession: (session: Session) => void;
  
  // Explicitly save an account to the switcher
  saveAccount: (session: Session, profileData?: { name?: string, avatar_url?: string }) => void;
  
  removeAccount: (id: string) => void;
  setActiveAccount: (id: string | null) => void;
  clearAll: () => void;
}

export const useMultiAccountStore = create<MultiAccountState>()(
  persist(
    (set) => ({
      accounts: {},
      activeAccountId: null,

      updateSession: (session) => set((state) => {
        if (!session?.user) return state;
        const id = session.user.id;
        
        // If it's already a saved account, update its session
        if (state.accounts[id]) {
          return {
            activeAccountId: id,
            accounts: {
              ...state.accounts,
              [id]: {
                ...state.accounts[id],
                session,
                updated_at: Date.now()
              }
            }
          };
        }
        
        // Otherwise just set it as active without saving it to accounts
        return { activeAccountId: id };
      }),

      saveAccount: (session, profileData) => set((state) => {
        if (!session?.user) return state;
        const id = session.user.id;
        const existing = state.accounts[id];
        return {
          activeAccountId: id,
          accounts: {
            ...state.accounts,
            [id]: {
              id,
              email: session.user.email || existing?.email || '',
              name: profileData?.name || existing?.name || session.user.user_metadata?.name || '',
              avatar_url: profileData?.avatar_url || existing?.avatar_url || session.user.user_metadata?.avatar_url || '',
              session,
              updated_at: Date.now()
            }
          }
        };
      }),

      removeAccount: (id) => set((state) => {
        const newAccounts = { ...state.accounts };
        delete newAccounts[id];
        return {
          accounts: newAccounts,
          activeAccountId: state.activeAccountId === id ? null : state.activeAccountId
        };
      }),

      setActiveAccount: (id) => set({ activeAccountId: id }),
      clearAll: () => set({ accounts: {}, activeAccountId: null })
    }),
    createPersistConfig('leaniqa-multi-account', (state) => ({
      accounts: state.accounts,
      activeAccountId: state.activeAccountId
    }))
  )
);
