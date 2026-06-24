import { supabase } from '../lib/supabase';

export const authService = {
  async getUserId(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      return session.user.id;
    }
    throw new Error('Not authenticated');
  }
};

