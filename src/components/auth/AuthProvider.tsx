import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import type { Session, User } from '@supabase/supabase-js';
import LoginScreen from './LoginScreen';
import { sentry } from '@/main';
import { Sentry } from '@/lib/sentry';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signIn: (params: { email: string; password: string; remember?: boolean }) => Promise<void>;
  signUp: (params: { email: string; password: string; fullName?: string; isHealthcareProfessional?: boolean }) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

function toFriendlyError(error: any): string {
  const msg = typeof error?.message === 'string' ? error.message : String(error || 'Unknown error');
  if (/invalid login credentials/i.test(msg)) return 'Invalid email or password.';
  if (/email already registered|user already registered/i.test(msg)) return 'An account with this email already exists.';
  if (/password should be at least|weak password/i.test(msg)) return 'Password is too weak. Use at least 8 characters with numbers and symbols.';
  if (/network|fetch/i.test(msg)) return 'Network error. Please check your connection and try again.';
  return msg;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        console.error('Auth getSession error', error);
        setError(toFriendlyError(error));
      }
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s ?? null);
      setUser(s?.user ?? null);

      if (event === 'SIGNED_IN') {
        toast('Signed in successfully');
      } else if (event === 'SIGNED_OUT') {
        toast('Signed out');
      } else if (event === 'TOKEN_REFRESHED') {
        // no toast to avoid noise
      } else if (event === 'USER_UPDATED') {
        toast('Account updated');
      } else if ((event as any) === 'TOKEN_REFRESH_FAILED') {
        toast('Session expired. Please sign in again.');
      }
    });

    const storageHandler = (e: StorageEvent) => {
      if (e.key === 'sb-' && e.storageArea === localStorage) {
        supabase.auth.getSession().then(({ data }) => {
          setSession(data.session ?? null);
          setUser(data.session?.user ?? null);
        });
      }
    };
    window.addEventListener('storage', storageHandler);

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
      window.removeEventListener('storage', storageHandler);
    };
  }, []);

  // Track user context for Sentry
  useEffect(() => {
    if (user) {
      sentry?.setUserContext({
        id: user.id,
        email: user.email,
      });
    } else {
      Sentry.setUser(null);
    }
  }, [user]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    session,
    loading,
    error,
    signIn: async ({ email, password, remember = true }) => {
      setError(null);
      setLoading(true);
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        localStorage.setItem('rememberMe', String(!!remember));
        if (!remember) {
          window.addEventListener('beforeunload', () => {
            supabase.auth.signOut();
          }, { once: true });
        }
        toast('Welcome back');
      } catch (err) {
        console.error('Sign in error', err);
        const msg = toFriendlyError(err);
        setError(msg);
        toast(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    signUp: async ({ email, password, fullName, isHealthcareProfessional }) => {
      setError(null);
      setLoading(true);
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName ?? null,
              is_healthcare_professional: !!isHealthcareProfessional,
            },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast('Check your email to verify your account');
      } catch (err) {
        console.error('Sign up error', err);
        const msg = toFriendlyError(err);
        setError(msg);
        toast(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    signOut: async () => {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Sign out error', err);
        toast('Error signing out');
      }
    },
    resetPassword: async (email: string) => {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        toast('Password reset email sent');
      } catch (err) {
        console.error('Reset password error', err);
        toast(toFriendlyError(err));
        throw err;
      }
    },
  }), [user, session, loading, error]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading...</div>;
  if (!user) return <LoginScreen />;
  return <>{children}</>;
};
