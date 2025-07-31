import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, testConnection } from '../lib/supabase';
import { authService, UserProfile } from '../services/authService';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  confirmEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from our custom users table
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching user profile for:', userId);
      return await authService.ensureUserProfile(userId);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Clear session on app start to require fresh login
  const clearSessionOnStart = async () => {
    try {
      console.log('Clearing session on app start...');
      await supabase.auth.signOut();
      // Clear any stored session data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('nellai-auth-token');
        sessionStorage.clear();
      }
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  };

  // Initialize auth state
  const initializeAuth = async () => {
    try {
      console.log('Initializing authentication state...');
      
      // Test database connection first
      const isConnected = await testConnection();
      if (!isConnected) {
        console.warn('Database connection test failed, but continuing...');
      }
      
      // Clear session on app start
      await clearSessionOnStart();
      
      // Set loading to false since we're requiring fresh login
      setLoading(false);
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Error initializing auth:', error);
      setUser(null);
      setUserProfile(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initialize auth state on mount
    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session ? 'User logged in' : 'No session');
      
      if (session?.user) {
        setUser(session.user);
        const profile = await fetchUserProfile(session.user.id);
        setUserProfile(profile);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting sign in for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }
      
      console.log('Sign in successful:', data.user?.id);
      
      // Fetch user profile after successful sign in
      if (data.user) {
        const profile = await fetchUserProfile(data.user.id);
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      console.log('Attempting sign up for:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
          emailRedirectTo: `${window.location.origin}/email-confirmation`,
        },
      });
      
      if (error) {
        console.error('Sign up error:', error);
        throw error;
      }
      
      console.log('Sign up successful:', data.user?.id);
      
      // No manual insert into users table; rely on trigger
      if (data.user) {
        setUserProfile({ 
          id: data.user.id, 
          name, 
          email, 
          created_at: new Date().toISOString(), 
          updated_at: new Date().toISOString() 
        });
      }
    } catch (error) {
      console.error('Sign up failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('Attempting sign out...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
      
      console.log('Sign out successful');
      setUser(null);
      setUserProfile(null);
      
      // Clear any stored session data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('nellai-auth-token');
        sessionStorage.clear();
      }
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  };

  const confirmEmail = async () => {
    try {
      console.log('Attempting to confirm email...');
      const data = await authService.confirmEmail();
      console.log('Email confirmed successfully');

      // Re-fetch user profile to ensure it's up-to-date
      if (user) {
        const profile = await fetchUserProfile(user.id);
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Email confirmation failed:', error);
      throw error;
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut,
    confirmEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}