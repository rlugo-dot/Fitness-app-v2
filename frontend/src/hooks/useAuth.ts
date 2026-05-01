import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data }) => { setSession(data.session); })
      .catch(() => {})
      .finally(() => setLoading(false));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const sendOtp = (email: string) =>
    supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

  const verifyOtp = (email: string, token: string) =>
    supabase.auth.verifyOtp({ email, token, type: 'email' });

  const signOut = () => supabase.auth.signOut();

  return { session, loading, sendOtp, verifyOtp, signOut };
}
