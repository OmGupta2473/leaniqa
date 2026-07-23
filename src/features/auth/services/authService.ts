import { useChatStore } from '@/app/store/chatStore';
import { useAuthStore } from '@/app/store/authStore';
import { supabase } from '@/shared/utils/supabase';
import { AppError, ErrorCodes } from '@/shared/utils/errors';

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

    return session.user.id;
  },
  
  async logout(): Promise<void> {
    await supabase.auth.signOut();
    useChatStore.getState().clearChatStore();
    useAuthStore.getState().setSession(null);
  }
};

