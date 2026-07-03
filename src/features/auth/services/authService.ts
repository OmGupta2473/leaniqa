import { supabase } from '@/shared/utils/supabase';
import { AppError, ErrorCodes } from '@/shared/utils/errors';

export const authService = {
  async getUserId(): Promise<string> {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      throw new AppError({
        code: ErrorCodes.UNAUTHORIZED,
        message: error.message,
        retryable: false,
        status: 401,
      });
    }

    if (session?.user) {
      return session.user.id;
    }
    
    throw new AppError({
      code: ErrorCodes.UNAUTHORIZED,
      message: 'Not authenticated',
      retryable: false,
      status: 401,
    });
  },
  
  async logout(): Promise<void> {
    await supabase.auth.signOut();
  }
};

