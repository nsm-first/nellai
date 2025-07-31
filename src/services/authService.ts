import { supabase } from '../lib/supabase';
import { handleSupabaseError } from '../lib/supabase';

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
        handleSupabaseError(error, 'confirm email');
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
      console.log('Ensuring user profile exists for:', userId);
      
      // First try to fetch existing profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (existingProfile) {
        console.log('User profile found:', existingProfile);
        return existingProfile;
      }

      // If profile doesn't exist, create it
      if (fetchError && fetchError.code === 'PGRST116') {
        console.log('User profile not found, creating new profile...');
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          throw new Error('No authenticated user found');
        }

        const newProfile = {
          id: userId,
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
          email: authUser.email || '',
        };

        console.log('Creating user profile:', newProfile);
        const { data: createdProfile, error: createError } = await supabase
          .from('users')
          .insert([newProfile])
          .select()
          .single();

        if (createError) {
          console.error('Error creating user profile:', createError);
          handleSupabaseError(createError, 'create user profile');
        }

        console.log('User profile created successfully:', createdProfile);
        return createdProfile;
      }

      if (fetchError) {
        console.error('Error fetching user profile:', fetchError);
        handleSupabaseError(fetchError, 'fetch user profile');
      }
      
      return null;
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
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        handleSupabaseError(error, 'update user profile');
      }

      return data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },
}; 