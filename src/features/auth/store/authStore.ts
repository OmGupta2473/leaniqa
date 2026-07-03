import { create } from 'zustand';

export interface AuthState {
  // Client-side auth state (if any, separate from Supabase session)
}

export const useAuthStore = create<AuthState>()((set) => ({
  // Initial state and actions
}));
