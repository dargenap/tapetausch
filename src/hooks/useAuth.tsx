import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Profil konnte nicht geladen werden', error);
    return null;
  }
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Zählt die Profil-Anfragen. Nur die neueste darf das Ergebnis setzen.
  const latestRequest = useRef(0);

  const loadProfile = useCallback(async (userId: string | undefined) => {
    const request = ++latestRequest.current;
    setLoading(true);
    const next = userId ? await fetchProfile(userId) : null;
    if (request !== latestRequest.current) return;
    setProfile(next);
    setLoading(false);
  }, []);

  // Sitzung beim Start lesen und jede Änderung mitbekommen.
  // Im Callback keine weiteren Supabase-Aufrufe, das kann laut Supabase hängen bleiben.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionReady(true);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setSessionReady(true);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  // Profil laden, sobald feststeht, wer angemeldet ist.
  const userId = session?.user.id;
  useEffect(() => {
    if (sessionReady) loadProfile(userId);
  }, [sessionReady, userId, loadProfile]);

  // Nach der Registrierung nötig: Das Profil entsteht erst nach dem Login.
  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    await loadProfile(data.session?.user.id);
  }, [loadProfile]);

  return (
    <AuthContext.Provider value={{ session, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth muss innerhalb von AuthProvider stehen');
  return value;
}
