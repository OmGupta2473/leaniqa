import { useChatStore } from '@/app/store/chatStore';
import { useAuthStore } from '@/app/store/authStore';
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
  
  async logout(): Promise<void> {
    await supabase.auth.signOut();
    useChatStore.getState().clearChatStore();
    useAuthStore.getState().setSession(null);
    analytics.reset();
  }
};

