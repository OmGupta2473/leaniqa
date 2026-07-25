import re

with open("src/features/profile/services/profileService.ts", "r") as f:
    content = f.read()

old_upsert = """  async upsertProfile(profileData: Partial<DbProfile>): Promise<DbProfile | null> {
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
  },"""

new_upsert = """  async upsertProfile(profileData: Partial<DbProfile>): Promise<DbProfile | null> {
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

      console.log('Attempting upsert for user_id:', userId, 'Payload:', payload);
      
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
  },"""

content = content.replace(old_upsert, new_upsert)

with open("src/features/profile/services/profileService.ts", "w") as f:
    f.write(content)

