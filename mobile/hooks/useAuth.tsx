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

  useEffect(() => {
    let mounted = true;

    const persistUserId = (nextUser: User | null) => {
      if (!nextUser) return;
      void storage.setUserId(nextUser.id).catch((storageError) => {
        console.warn('[Auth] Failed to persist user id:', storageError);
      });
    };

    const applyAuthState = (nextSession: Session | null) => {
      if (!mounted) return;
      setSession(nextSession ?? null);
      setUser(nextSession?.user ?? null);
      setLoading(false);
      persistUserId(nextSession?.user ?? null);
    };

    const clearLocalSession = async () => {
      await Promise.allSettled([supabase.auth.signOut(), storage.clearAll()]);
      if (!mounted) return;
      setSession(null);
      setUser(null);
      setLoading(false);
    };

    // Listener first to avoid missing restored sessions, but do not await inside callback.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applyAuthState(nextSession ?? null);
    });

    const initializeAuth = async () => {
      try {
        const { data: { session: restoredSession }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error('Error checking session:', error);
          if (error.message?.includes('user_not_found') || error.code === 'user_not_found') {
            console.warn('[Auth] Stale session detected (user deleted), signing out');
            await clearLocalSession();
            return;
          }

          applyAuthState(null);
          return;
        }

        if (!restoredSession) {
          applyAuthState(null);
          return;
        }

        try {
          const { error: userError } = await supabase.auth.getUser();

          if (userError) {
            if (userError.message?.includes('user_not_found') || userError.code === 'user_not_found') {
              console.warn('[Auth] Stale session detected during validation, signing out');
              await clearLocalSession();
              return;
            }

            console.warn('[Auth] Session validation skipped:', userError.message);
          }
        } catch (validationError) {
          console.warn('[Auth] Session validation failed due to network issue:', validationError);
        }

        applyAuthState(restoredSession);
      } catch (error) {
        console.warn('[Auth] Failed to restore session:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
      await Promise.allSettled([supabase.auth.signOut(), storage.clearAll()]);
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
        refreshSession: async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session ?? null);
            setUser(session?.user ?? null);
          } catch (error) {
            console.warn('[Auth] Failed to refresh session:', error);
          }
        },
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
