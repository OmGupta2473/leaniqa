import { useChatStore } from '@/app/store/chatStore';
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
    
    // Check if the user is actually valid on the server
    // This catches cases where the user was manually deleted from the database
    // but the session token is still cached in local storage.
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.warn('Local session exists but user is invalid on server. Logging out.');
      await supabase.auth.signOut();
      useChatStore.getState().clearChatStore();
      throw new AppError({
        code: ErrorCodes.UNAUTHORIZED,
        message: 'User session invalid or expired. Please log in again.',
        retryable: false,
        status: 401,
      });
    }

    return user.id;
  },
  
  async logout(): Promise<void> {
    await supabase.auth.signOut();
    useChatStore.getState().clearChatStore();
  }
};

