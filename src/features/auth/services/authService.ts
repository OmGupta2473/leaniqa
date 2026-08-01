import { useChatStore } from '@/app/store/chatStore';
import { useMultiAccountStore } from '@/app/store/multiAccountStore';
import { useAuthStore } from '@/app/store/authStore';
import { useUserStore } from '@/features/profile/store/userStore';
import { useAppStore } from '@/app/store/appStore';
import { useAwardStore } from '@/features/awards/store/awardStore';
import { useDashboardStore } from '@/features/dashboard/store/dashboardStore';
import { useNutritionStore } from '@/features/nutrition/store/nutritionStore';
import { useReportStore } from '@/features/reports/store/reportStore';
import { queryClient } from '@/app/query/queryClient';

import { supabase } from '@/shared/utils/supabase';
import { AppError, ErrorCodes } from '@/shared/utils/errors';
import { analytics } from '@/shared/utils/analytics';

export const authService = {
  async getUserId(): Promise<string> {
    // First try to get the active session from local cache
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      throw new AppError({
        code: ErrorCodes.UNAUTHORIZED,
        message: sessionError.message,
        retryable: false,
        status: 401,
      });
    }

    if (!session?.user) {
      throw new AppError({
        code: ErrorCodes.UNAUTHORIZED,
        message: 'Not authenticated',
        retryable: false,
        status: 401,
      });
    }

    // Verify the user actually exists in the database still
    // This is important because in development, the database might be reset while the local session is still active
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      await this.logout();
      window.location.href = '/login';
      throw new AppError({
        code: ErrorCodes.UNAUTHORIZED,
        message: 'Your session is invalid or has expired. Please log in again.',
        retryable: false,
        status: 401,
      });
    }

    return user.id;
  },
  
  clearCaches() {
    useChatStore.getState().clearChatStore();
    useAuthStore.getState().setSession(null);
    useUserStore.getState().clearUserStore();
    useAppStore.getState().clearAppStore();
    useAwardStore.getState().clearAwardStore();
    useDashboardStore.getState().clearDashboardStore();
    useNutritionStore.getState().clearNutritionStore();
    useReportStore.getState().clearReportStore();
    queryClient.clear();
    analytics.reset();
  },

  async logout(logoutAll: boolean = false): Promise<void> {
    const state = useMultiAccountStore.getState();
    const activeId = state.activeAccountId;
    
    await supabase.auth.signOut();
    this.clearCaches();
    
    if (logoutAll) {
      state.clearAll();
    } else if (activeId) {
      state.removeAccount(activeId);
      // Auto-switch to another account if available
      const remainingAccounts = Object.values(useMultiAccountStore.getState().accounts);
      if (remainingAccounts.length > 0) {
        // We will just let the caller handle redirection or switching
      }
    }
  },


  async prepareAddAccount(): Promise<void> {
    await supabase.auth.signOut();
    this.clearCaches();
    // Intentionally do NOT remove anything from multiAccountStore
  },
  async switchAccount(accountId: string): Promise<void> {
    const multiAccountStore = useMultiAccountStore.getState();
    const account = multiAccountStore.accounts[accountId];
    if (!account) throw new Error("Account not found");

    this.clearCaches();

    const { data, error } = await supabase.auth.setSession({
      access_token: account.session.access_token,
      refresh_token: account.session.refresh_token,
    });
    
    if (error) {
       // If refresh fails, they might need to log in again
       throw error;
    }

    multiAccountStore.setActiveAccount(accountId);
  }
};

