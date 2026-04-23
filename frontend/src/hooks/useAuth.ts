import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signIn = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password });

  const signUp = async (email: string, password: string, fullName: string) => {
    const result = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (result.data.user && !result.error) {
      await supabase.from('profiles').upsert(
        { id: result.data.user.id, full_name: fullName },
        { onConflict: 'id' }
      );
    }
    return result;
  };

  const signOut = () => supabase.auth.signOut();

  return { session, loading, signIn, signUp, signOut };
}
