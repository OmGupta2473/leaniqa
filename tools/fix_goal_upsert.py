import re

with open("src/features/profile/services/profileService.ts", "r") as f:
    content = f.read()

old_goal = """  async upsertGoal(goalData: Partial<DbGoal>): Promise<DbGoal | null> {
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
  },"""

new_goal = """  async upsertGoal(goalData: Partial<DbGoal>): Promise<DbGoal | null> {
    try {
      const userId = await authService.getUserId();
      const payload = {
        ...goalData,
        user_id: userId,
      };
      
      console.log('Attempting upsert goal for user_id:', userId, 'Payload:', payload);

      const { data: existingGoal, error: fetchError } = await supabase
        .from('goals')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

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
  },"""

content = content.replace(old_goal, new_goal)

with open("src/features/profile/services/profileService.ts", "w") as f:
    f.write(content)
