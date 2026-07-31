import { supabase } from '@/shared/utils/supabase';
import { DbProfile, DbGoal } from '@/shared/types/supabase';
import { authService } from '@/features/auth/services/authService';
import { AppError, ErrorCodes } from '@/shared/utils/errors';
import { devLog } from '@/shared/utils/logger';

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
      
      devLog('Attempting profile upsert for user_id:', userId, 'Payload:', payload);

      // Check if profile exists first
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      devLog('Existing profile check:', existingProfile, 'Error:', fetchError);

      let data, error;
      
      const performUpsert = async (payloadToUse: any, updatePayloadToUse: any) => {
        if (existingProfile) {
          if (Object.keys(updatePayloadToUse).length === 0) {
            return { data: existingProfile, error: null };
          }
          const updateRes = await supabase
            .from('profiles')
            .update(updatePayloadToUse)
            .eq('id', userId)
            .select()
            .maybeSingle();
          return { data: updateRes.data, error: updateRes.error };
        } else {
          const insertRes = await supabase
            .from('profiles')
            .insert(payloadToUse)
            .select()
            .maybeSingle();
          return { data: insertRes.data, error: insertRes.error };
        }
      };

      let res = await performUpsert(payload, profileData);
      data = res.data;
      error = res.error;

      if (error && (error.message.includes('could not find the carbs_target') || error.message.includes('carbs_target') || error.message.includes('fat_target') || error.message.includes('water_target'))) {
        devLog('Schema cache error detected, retrying without new columns');
        const fallbackPayload = { ...payload };
        delete fallbackPayload.carbs_target;
        delete fallbackPayload.fat_target;
        delete fallbackPayload.water_target;
        
        const fallbackUpdatePayload = { ...profileData };
        delete fallbackUpdatePayload.carbs_target;
        delete fallbackUpdatePayload.fat_target;
        delete fallbackUpdatePayload.water_target;
        
        try {
          const { useUserStore } = await import('@/features/profile/store/userStore');
          const overridesToUpdate: any = {};
          if ('carbs_target' in payload) overridesToUpdate.carbs_target = payload.carbs_target;
          if ('fat_target' in payload) overridesToUpdate.fat_target = payload.fat_target;
          if ('water_target' in payload) overridesToUpdate.water_target = payload.water_target;
          
          if (Object.keys(overridesToUpdate).length > 0) {
            useUserStore.getState().setMacroOverrides(overridesToUpdate);
          }
        } catch (e) {
          console.error('Failed to store macro overrides', e);
        }

        res = await performUpsert(fallbackPayload, fallbackUpdatePayload);
        data = res.data;
        error = res.error;
      }

      devLog('Upsert result:', data, 'Error:', error);
        
      if (error && error.code !== 'PGRST116') {
        console.error('upsertProfile error:', error);
        
        // If it's a foreign key violation on profiles_id_fkey, it means the user was deleted from the database
        // but the local session is still active. Force a logout.
        if (error.code === '23503' && error.message.includes('profiles_id_fkey')) {
          await authService.logout();
          window.location.href = '/login';
          throw new AppError({
            code: ErrorCodes.UNAUTHORIZED,
            message: 'Your session has expired. Please log in again.',
            retryable: false,
            status: 401,
            details: error,
          });
        }
        
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

      devLog('Attempting goal upsert for user_id:', userId, 'Payload:', payload);

      const { data: existingGoal, error: fetchError } = await supabase
        .from('goals')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
        
      devLog('Existing goal check:', existingGoal, 'Error:', fetchError);

      let data, error;

      if (existingGoal) {
        devLog('Goal exists, performing update');
        const updateRes = await supabase
          .from('goals')
          .update(goalData)
          .eq('user_id', userId)
          .select()
          .maybeSingle();
        data = updateRes.data;
        error = updateRes.error;
      } else {
        devLog('Goal does not exist, performing insert');
        const insertRes = await supabase
          .from('goals')
          .insert(payload)
          .select()
          .maybeSingle();
        data = insertRes.data;
        error = insertRes.error;
      }

      devLog('Upsert goal result:', data, 'Error:', error);
        
      if (error && error.code !== 'PGRST116') {
        console.error('upsertGoal error:', error);
        
        if (error.code === '23503' && error.message.includes('goals_user_id_fkey')) {
          await authService.logout();
          window.location.href = '/login';
          throw new AppError({
            code: ErrorCodes.UNAUTHORIZED,
            message: 'Your session has expired. Please log in again.',
            retryable: false,
            status: 401,
            details: error,
          });
        }
        
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
