"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';

interface SessionGuardProps {
  children: React.ReactNode;
  redirectToDashboard?: boolean;
}

// Use this on public pages (home, login) to redirect logged-in users to dashboard
export function SessionGuard({ children, redirectToDashboard = false }: SessionGuardProps) {
  const router = useRouter();
  const { session, loading } = useSession();
  const [serverCheckDone, setServerCheckDone] = useState(false);

  useEffect(() => {
    if (!loading && redirectToDashboard && session) {
      // Client-side only: verify session via /api/auth/session
      // If it fails, clear stale localStorage and redirect to /login
      fetch('/api/auth/session')
        .then(res => res.json())
        .then(data => {
          setServerCheckDone(true);
          if (data.authenticated) {
            const driverId = data.data?.driverId || data.session?.driverId;
            router.replace(`/dashboard/${driverId}`);
          } else {
            // Server session invalid/expired - clear stale localStorage
            localStorage.removeItem('eitaxi_session');
            localStorage.removeItem('eitaxi_driver_id');
          }
        })
        .catch(() => {
          setServerCheckDone(true);
          // If we can't reach the server, clear stale localStorage
          localStorage.removeItem('eitaxi_session');
          localStorage.removeItem('eitaxi_driver_id');
        });
    } else if (!loading) {
      setServerCheckDone(true);
    }
  }, [loading, session, redirectToDashboard, router]);

  // Show spinner while checking session
  if (loading || (redirectToDashboard && session && !serverCheckDone)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return <>{children}</>;
}

// Use this on protected pages (dashboard) to redirect non-logged-in users to login
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { session, loading } = useSession();

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
