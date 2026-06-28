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

    // First check if a profile already exists for this user
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    const payload: any = {
      ...profileData,
      id: userId,
      email: realEmail,
      updated_at: new Date().toISOString()
    };

    let data, error;

    if (existing?.id) {
      // Update existing row
      const result = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      // Insert new row
      const result = await supabase
        .from('profiles')
        .insert({ ...payload, created_at: new Date().toISOString() })
        .select()
        .single();
      data = result.data;
      error = result.error;
    }
      
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
    
    // First check if a goal already exists for this user
    const { data: existing } = await supabase
      .from('goals')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    const payload: any = {
      ...goalData,
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    let data, error;

    if (existing?.id) {
      // Update existing row by id — avoids ON CONFLICT entirely
      const result = await supabase
        .from('goals')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      // Insert new row
      const result = await supabase
        .from('goals')
        .insert({ ...payload })
        .select()
        .single();
      data = result.data;
      error = result.error;
    }
      
    if (error) {
      console.error('Error upserting goal:', error);
      throw error;
    }
    return data;
  },

  async deleteGoal(): Promise<void> {
    const userId = await authService.getUserId();
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error deleting goal:', error);
      throw error;
    }
  }
};
