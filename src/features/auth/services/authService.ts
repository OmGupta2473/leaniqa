import { useChatStore } from '@/app/store/chatStore';
import { useAuthStore } from '@/app/store/authStore';
import { useUserStore } from '@/features/profile/store/userStore';
import { useAppStore } from '@/app/store/appStore';
import { useAwardStore } from '@/features/awards/store/awardStore';
import { useDashboardStore } from '@/features/dashboard/store/dashboardStore';
import { useNutritionStore } from '@/features/nutrition/store/nutritionStore';
import { useReportStore } from '@/features/reports/store/reportStore';
import { queryClient } from '@/app/query/queryClient';
import { queryPersister, REACT_QUERY_OFFLINE_CACHE_KEY } from '@/app/query/queryPersister';

import { supabase } from '@/shared/utils/supabase';
import { AppError, ErrorCodes } from '@/shared/utils/errors';
import { analytics } from '@/shared/utils/analytics';
import { clearCrashReportingUser } from '@/shared/utils/logger';
import { getSessionUserId } from '@/shared/utils/sessionUser';
import { offlineSyncService } from '@/shared/services/offlineSyncService';

let sessionEndPromise: Promise<void> | null = null;

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
  
  async clearCaches(): Promise<void> {
    const userId = getSessionUserId();

    useChatStore.getState().clearChatStore();
    useAuthStore.getState().setSession(null);
    useUserStore.getState().clearUserStore();
    useAppStore.getState().clearAppStore();
    useAwardStore.getState().clearAwardStore();
    useDashboardStore.getState().clearDashboardStore();
    useNutritionStore.getState().clearNutritionStore();
    useReportStore.getState().clearReportStore();
    queryClient.clear();
    offlineSyncService.clearQueueForUser(userId);
    analytics.reset();
    clearCrashReportingUser();

    // query-sync-storage-persister@5.101.4 provides removeClient().
    if (typeof queryPersister.removeClient === 'function') {
      await queryPersister.removeClient();
    } else if (typeof window !== 'undefined') {
      window.localStorage.removeItem(REACT_QUERY_OFFLINE_CACHE_KEY);
    }
  },

  onSessionEnded(): Promise<void> {
    if (!sessionEndPromise) {
      sessionEndPromise = this.clearCaches().finally(() => {
        sessionEndPromise = null;
      });
    }
    return sessionEndPromise;
  },

  async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } finally {
      await this.onSessionEnded();
    }
  }
};

