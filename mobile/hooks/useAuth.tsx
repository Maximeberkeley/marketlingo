import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { storage } from '../lib/storage';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error: string | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ success: boolean; error: string | null; message?: string }>;
  signOut: () => Promise<{ success: boolean; error: string | null }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error: string | null }>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) console.error('Error checking session:', error);
      setSession(session ?? null);
      setUser(session?.user ?? null);
      if (session?.user) await storage.setUserId(session.user.id);
    } catch (error) {
      console.error('Error in checkSession:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        setSession(session ?? null);
        setUser(session?.user ?? null);
        setLoading(false);
        if (session?.user) await storage.setUserId(session.user.id);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [checkSession]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      if (data.user) await storage.setUserId(data.user.id);
      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error: error.message || 'Sign in failed' };
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        console.error('[Auth] Signup error:', error.message, error.status);
        return { success: false, error: error.message };
      }
      if (data.user && !data.session) {
        return { success: true, error: null, message: 'Please check your email to confirm your account' };
      }
      if (data.user) await storage.setUserId(data.user.id);
      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error: error.message || 'Sign up failed' };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      await storage.clearAll();
      setUser(null);
      setSession(null);
      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error: error.message || 'Sign out failed' };
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) return { success: false, error: error.message };
      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error: error.message || 'Password reset failed' };
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAuthenticated: !!user,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        resetPassword,
        refreshSession: checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
