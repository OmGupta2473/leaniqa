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

  async updateProfile(profileData: Partial<DbProfile>): Promise<DbProfile | null> {
    try {
      const userId = await authService.getUserId();
      
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userId)
        .select()
        .maybeSingle();
        
      if (error) {
        throw new AppError({
          code: ErrorCodes.INTERNAL_SERVER_ERROR,
          message: `Failed to update profile: ${error.message} (code: ${error.code})`,
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
        message: 'An unexpected error occurred while updating profile',
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
      
      console.log('Attempting profile upsert for user_id:', userId, 'Payload:', payload);

      // Check if profile exists first
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      console.log('Existing profile check:', existingProfile, 'Error:', fetchError);

      let data, error;

      if (existingProfile) {
        console.log('Profile exists, performing update');
        const updateRes = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', userId)
          .select()
          .maybeSingle();
        data = updateRes.data;
        error = updateRes.error;
      } else {
        console.log('Profile does not exist, performing insert');
        const insertRes = await supabase
          .from('profiles')
          .insert(payload)
          .select()
          .maybeSingle();
        data = insertRes.data;
        error = insertRes.error;
      }

      console.log('Upsert result:', data, 'Error:', error);
        
      if (error && error.code !== 'PGRST116') {
        console.error('upsertProfile error:', error);
        throw new AppError({
          code: ErrorCodes.INTERNAL_SERVER_ERROR,
          message: `Failed to upsert profile: ${error.message} (code: ${error.code})`,
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

      console.log('Attempting goal upsert for user_id:', userId, 'Payload:', payload);

      const { data: existingGoal, error: fetchError } = await supabase
        .from('goals')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
        
      console.log('Existing goal check:', existingGoal, 'Error:', fetchError);

      let data, error;

      if (existingGoal) {
        console.log('Goal exists, performing update');
        const updateRes = await supabase
          .from('goals')
          .update(goalData)
          .eq('user_id', userId)
          .select()
          .maybeSingle();
        data = updateRes.data;
        error = updateRes.error;
      } else {
        console.log('Goal does not exist, performing insert');
        const insertRes = await supabase
          .from('goals')
          .insert(payload)
          .select()
          .maybeSingle();
        data = insertRes.data;
        error = insertRes.error;
      }

      console.log('Upsert goal result:', data, 'Error:', error);
        
      if (error && error.code !== 'PGRST116') {
        console.error('upsertGoal error:', error);
        throw new AppError({
          code: ErrorCodes.INTERNAL_SERVER_ERROR,
          message: `Failed to upsert goal: ${error.message} (code: ${error.code})`,
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
