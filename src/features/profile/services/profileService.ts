import { supabase } from '@/shared/utils/supabase';
import { DbProfile, DbGoal } from '@/shared/types/supabase';
import { authService } from '@/features/auth/services/authService';
import { AppError, ErrorCodes } from '@/shared/utils/errors';

export const profileService = {
  async getProfile(): Promise<DbProfile | null> {
    try {
      const userId = await authService.getUserId();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (error && error.code !== 'PGRST116') {
        throw new AppError({
          code: ErrorCodes.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch profile',
          retryable: true,
          status: 500,
          details: error,
        });
      }
      return data;
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError({
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred while fetching profile',
        retryable: false,
        status: 500,
        details: err,
      });
    }
  },

  async upsertProfile(profileData: Partial<DbProfile>): Promise<DbProfile | null> {
    try {
      const [userId, { data: { session } }] = await Promise.all([
        authService.getUserId(),
        supabase.auth.getSession()
      ]);
      const realEmail = session?.user?.email || '';

      const payload = {
        ...profileData,
        id: userId,
        email: realEmail,
      };
      

      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error("UPSERT PROFILE ERROR", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          payload
        });
        throw new AppError({
          code: ErrorCodes.INTERNAL_SERVER_ERROR,
          message: 'Failed to upsert profile',
          retryable: true,
          status: 500,
          details: error,
        });
      }
      return data || (payload as DbProfile);
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError({
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred while upserting profile',
        retryable: false,
        status: 500,
        details: err,
      });
    }
  },

  async getGoal(): Promise<DbGoal | null> {
    try {
      const userId = await authService.getUserId();
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (error && error.code !== 'PGRST116') {
        throw new AppError({
          code: ErrorCodes.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch goal',
          retryable: true,
          status: 500,
          details: error,
        });
      }
      return data;
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError({
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred while fetching goal',
        retryable: false,
        status: 500,
        details: err,
      });
    }
  },

  async upsertGoal(goalData: Partial<DbGoal>): Promise<DbGoal | null> {
    try {
      const userId = await authService.getUserId();

      const payload = {
        ...goalData,
        user_id: userId,
      };

      const { data, error } = await supabase
        .from('goals')
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .maybeSingle();
        
      if (error && error.code !== 'PGRST116') {
        throw new AppError({
          code: ErrorCodes.INTERNAL_SERVER_ERROR,
          message: 'Failed to upsert goal',
          retryable: true,
          status: 500,
          details: error,
        });
      }
      return data || (payload as DbGoal);
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError({
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred while upserting goal',
        retryable: false,
        status: 500,
        details: err,
      });
    }
  },

  async deleteGoal(): Promise<void> {
    try {
      const userId = await authService.getUserId();
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('user_id', userId);
        
      if (error) {
        throw new AppError({
          code: ErrorCodes.INTERNAL_SERVER_ERROR,
          message: 'Failed to delete goal',
          retryable: true,
          status: 500,
          details: error,
        });
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError({
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred while deleting goal',
        retryable: false,
        status: 500,
        details: err,
      });
    }
  },

  async deleteProfile(): Promise<void> {
    try {
      const userId = await authService.getUserId();
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
        
      if (error) {
        throw new AppError({
          code: ErrorCodes.INTERNAL_SERVER_ERROR,
          message: 'Failed to delete profile',
          retryable: true,
          status: 500,
          details: error,
        });
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError({
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred while deleting profile',
        retryable: false,
        status: 500,
        details: err,
      });
    }
  }
};
