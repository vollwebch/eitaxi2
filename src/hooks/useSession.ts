"use client";

import { useState, useEffect, useCallback } from 'react';

interface SessionData {
  driverId: string;
  email: string;
  name: string;
  loginTime: string;
}

interface UseSessionReturn {
  session: SessionData | null;
  loading: boolean;
  isLoggedIn: boolean;
  logout: () => void;
  checkSession: () => SessionData | null;
}

const SESSION_KEY = 'eitaxi_session';
const SESSION_COOKIE = 'eitaxi_driver_id';

export function useSession(): UseSessionReturn {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  // Check session on mount
  useEffect(() => {
    checkSession();
    setLoading(false);
  }, []);

  const checkSession = useCallback((): SessionData | null => {
    if (typeof window === 'undefined') return null;

    try {
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (sessionData) {
        const parsed = JSON.parse(sessionData) as SessionData;
        setSession(parsed);
        return parsed;
      }
    } catch {
      console.error('Error parsing session');
    }

    // Check cookie as fallback
    const cookies = document.cookie.split(';');
    const driverIdCookie = cookies.find(c => c.trim().startsWith(`${SESSION_COOKIE}=`));
    if (driverIdCookie) {
      const driverId = driverIdCookie.split('=')[1];
      // Create minimal session from cookie
      const minimalSession: SessionData = {
        driverId,
        email: '',
        name: '',
        loginTime: new Date().toISOString(),
      };
      setSession(minimalSession);
      return minimalSession;
    }

    setSession(null);
    return null;
  }, []);

  const logout = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Clear localStorage
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('widget-driverId');
    localStorage.removeItem('gps-notifications-enabled');
    localStorage.removeItem('gps-reminder-interval');

    // Clear old cookie
    document.cookie = `${SESSION_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;

    // Clear state
    setSession(null);

    // Call server-side logout to clear HTTP-only cookie
    fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
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
