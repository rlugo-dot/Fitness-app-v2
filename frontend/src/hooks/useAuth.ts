import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const SESSION_KEY = 'nutrisyon_login_at';
const SESSION_MAX_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function isSessionExpired(): boolean {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return false;
  return Date.now() - parseInt(raw, 10) > SESSION_MAX_MS;
}

function recordLogin() {
  localStorage.setItem(SESSION_KEY, Date.now().toString());
}

function clearLogin() {
  localStorage.removeItem(SESSION_KEY);
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession()
      .then(async ({ data }) => {
        if (data.session && isSessionExpired()) {
          await supabase.auth.signOut();
          clearLogin();
          setSession(null);
        } else {
          setSession(data.session);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) clearLogin();
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const sendOtp = (email: string) =>
    supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

  const verifyOtp = async (email: string, token: string) => {
    const result = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (!result.error) recordLogin();
    return result;
  };

  const signOut = async () => {
    clearLogin();
    return supabase.auth.signOut();
  };

  return { session, loading, sendOtp, verifyOtp, signOut };
}
