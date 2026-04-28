"use client";

import { useState, useEffect, useCallback } from 'react';

interface ClientSessionData {
  clientId: string;
  email: string;
  name: string;
  loginTime: string;
}

interface UseClientSessionReturn {
  session: ClientSessionData | null;
  loading: boolean;
  isLoggedIn: boolean;
  logout: () => void;
  checkSession: () => ClientSessionData | null;
}

const CLIENT_SESSION_KEY = 'eitaxi_client_session';

export function useClientSession(): UseClientSessionReturn {
  const [session, setSession] = useState<ClientSessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
    setLoading(false);
  }, []);

  const checkSession = useCallback((): ClientSessionData | null => {
    if (typeof window === 'undefined') return null;

    try {
      const sessionData = localStorage.getItem(CLIENT_SESSION_KEY);
      if (sessionData) {
        const parsed = JSON.parse(sessionData) as ClientSessionData;
        setSession(parsed);
        return parsed;
      }
    } catch {
      console.error('Error parsing client session');
    }

    setSession(null);
    return null;
  }, []);

  const logout = useCallback(() => {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(CLIENT_SESSION_KEY);

    setSession(null);

    fetch('/api/auth/client/logout', { method: 'POST' }).finally(() => {
      window.location.href = '/';
    });
  }, []);

  return {
    session,
    loading,
    isLoggedIn: !!session,
    logout,
    checkSession,
  };
}
