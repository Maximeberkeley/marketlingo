import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { CapacitorStorage } from "@/lib/capacitor-storage";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithApple: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Persist session to Capacitor storage for native apps
  const persistSession = useCallback(async (session: Session | null) => {
    if (session) {
      await CapacitorStorage.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        expires_in: session.expires_in,
        token_type: session.token_type,
        user: session.user,
      });
    } else {
      await CapacitorStorage.clearSession();
    }
  }, []);

  // Restore session from Capacitor storage on native platforms
  const restoreNativeSession = useCallback(async () => {
    if (!CapacitorStorage.isNative()) return null;
    
    const storedSession = await CapacitorStorage.getSession() as {
      refresh_token?: string;
    } | null;
    
    if (storedSession?.refresh_token) {
      try {
        // Use the stored refresh token to get a new session
        const { data, error } = await supabase.auth.setSession({
          access_token: (storedSession as any).access_token,
          refresh_token: storedSession.refresh_token,
        });
        
        if (!error && data.session) {
          return data.session;
        }
      } catch (err) {
        console.error('Failed to restore native session:', err);
        await CapacitorStorage.clearSession();
      }
    }
    return null;
  }, []);

  useEffect(() => {
    let mounted = true;

    // Initialize auth
    const initAuth = async () => {
      // First try to restore from Capacitor storage (for native apps)
      const nativeSession = await restoreNativeSession();
      
      if (nativeSession && mounted) {
        setSession(nativeSession);
        setUser(nativeSession.user);
        setLoading(false);
        return;
      }

      // Fallback to checking Supabase's built-in session (for web)
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          
          // Persist session changes to Capacitor storage
          persistSession(session);
        }
      }
    );

    initAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [restoreNativeSession, persistSession]);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signInWithGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    return { error: result.error ?? null };
  };

  const signInWithApple = async () => {
    const result = await lovable.auth.signInWithOAuth("apple", {
      redirect_uri: window.location.origin,
    });
    return { error: result.error ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    await CapacitorStorage.clearSession();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signInWithApple,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
