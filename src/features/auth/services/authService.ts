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

// A genuine auth failure means the server told us the credential is
// invalid or gone. Network errors, 5xx, and timeouts are NOT auth
// failures — they mean we couldn't ask the server.
function isAuthError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { code?: string; name?: string; status?: number };
  if (e.status === 401) return true;
  if (e.code === 'invalid_jwt') return true;
  if (e.code === 'session_not_found') return true;
  if (e.name === 'AuthSessionMissingError') return true;
  if (e.name === 'AuthApiError' && e.status === 401) return true;
  return false;
}

function isRetryableNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { code?: string; message?: string; name?: string; status?: number };
  if (e.name === 'AuthRetryableFetchError') return true;
  if (e.status === 0) return true;
  if (e.status === undefined && typeof e.message === 'string') {
    const m = e.message.toLowerCase();
    if (m.includes('fetch') || m.includes('network') || m.includes('offline')) return true;
  }
  return false;
}

// Default-deny: only true if we positively identified an auth error.
function classifyGetUserError(error: unknown): 'auth' | 'retryable' {
  return isAuthError(error) ? 'auth' : 'retryable';
}

export const authService = {
  async getUserId(): Promise<string> {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      if (classifyGetUserError(sessionError) === 'auth') {
        throw new AppError({
          code: ErrorCodes.UNAUTHORIZED,
          message: 'Your session is invalid or has expired. Please log in again.',
          retryable: false,
          status: 401,
          details: sessionError,
        });
      }
      throw new AppError({
        code: ErrorCodes.NETWORK_ERROR,
        message: 'Unable to read your session. Please check your connection and try again.',
        retryable: true,
        status: 0,
        details: sessionError,
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

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      if (classifyGetUserError(userError) === 'auth') {
        await this.logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new AppError({
          code: ErrorCodes.UNAUTHORIZED,
          message: 'Your session is invalid or has expired. Please log in again.',
          retryable: false,
          status: 401,
          details: userError,
        });
      }
      throw new AppError({
        code: ErrorCodes.NETWORK_ERROR,
        message: 'Unable to verify your session. Please check your connection and try again.',
        retryable: true,
        status: 0,
        details: userError,
      });
    }

    if (!user) {
      await this.logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
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
  },

  /**
   * Link a Google identity to the CURRENTLY signed-in user. Unlike
   * signInWithOAuth, this preserves the existing user UUID — it upgrades an
   * anonymous user into a permanent one without creating a new account.
   * Requires: Manual Linking enabled in Supabase Auth settings.
   */
  async linkGoogleIdentity(
    redirectTo: string,
  ): Promise<{ url: string | null; error: string | null }> {
    const { data, error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: {
        redirectTo,
        scopes: 'email profile',
      },
    });
    if (error) {
      return { url: null, error: error.message };
    }
    return { url: data?.url ?? null, error: null };
  },
};

