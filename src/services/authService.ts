import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export const authService = {
  // Handle email confirmation
  async confirmEmail() {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Email confirmation error:', error);
      throw error;
    }
  },

  // Ensure user profile exists in database
  async ensureUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      // First try to fetch existing profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (existingProfile) {
        return existingProfile;
      }

      // If profile doesn't exist, create it
      if (fetchError && fetchError.code === 'PGRST116') {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          throw new Error('No authenticated user found');
        }

        const newProfile = {
          id: userId,
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
          email: authUser.email || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('users')
          .insert([newProfile])
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        return createdProfile;
      }

      throw fetchError;
    } catch (error) {
      console.error('Error ensuring user profile:', error);
      throw error;
    }
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },
}; 