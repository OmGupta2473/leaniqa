import { supabase } from '../lib/supabase';
import { DbProfile, DbGoal } from '../types/supabase';
import { authService } from './authService';

export const profileService = {
  async getProfile(): Promise<DbProfile | null> {
    const userId = await authService.getUserId();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data;
  },

  async upsertProfile(profileData: Partial<DbProfile>): Promise<DbProfile | null> {
    const userId = await authService.getUserId();
    const { data: { session } } = await supabase.auth.getSession();
    const realEmail = session?.user?.email || '';

    const payload = {
      ...profileData,
      id: userId,
      email: realEmail
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload)
      .select()
      .single();
      
    if (error) {
      console.error('Error upserting profile:', error);
      throw error;
    }
    return data;
  },

  async getGoal(): Promise<DbGoal | null> {
    const userId = await authService.getUserId();
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching goal:', error);
      return null;
    }
    return data;
  },

  async upsertGoal(goalData: Partial<DbGoal>): Promise<DbGoal | null> {
    const userId = await authService.getUserId();
    const payload = {
      ...goalData,
      user_id: userId,
    };

    const { data, error } = await supabase
      .from('goals')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();
      
    if (error) {
      console.error('Error upserting goal:', error);
      throw error;
    }
    return data;
  }
};
