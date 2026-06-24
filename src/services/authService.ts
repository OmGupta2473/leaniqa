import { supabase } from '../lib/supabase';

// For this prototype, if auth is not strictly required to be a login screen,
// we can manage a local persistent user ID, or integrate with Supabase Auth.
export const authService = {
  async getUserId(): Promise<string> {
    // Check if we have an active session
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      return session.user.id;
    }

    // Fallback for prototype testing without login screen
    let localId = localStorage.getItem('guest_user_id');
    if (!localId) {
      localId = crypto.randomUUID();
      localStorage.setItem('guest_user_id', localId);
    }
    return localId;
  }
};
