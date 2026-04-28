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
  const [serverSessionValid, setServerSessionValid] = useState<boolean | null>(null);

  useEffect(() => {
    // Check driver session
    if (!loading && redirectToDashboard && session) {
      fetch('/api/auth/session')
        .then(res => res.json())
        .then(data => {
          if (data.authenticated) {
            setServerSessionValid(true);
            const driverId = data.data?.driverId || data.session?.driverId;
            router.replace(`/dashboard/${driverId}`);
          } else {
            setServerSessionValid(false);
            localStorage.removeItem('eitaxi_session');
            localStorage.removeItem('eitaxi_driver_id');
          }
        })
        .catch(() => {
          setServerSessionValid(false);
          localStorage.removeItem('eitaxi_session');
        });
    }

    // Check client session
    if (!loading && !session && redirectToDashboard && serverSessionValid === null) {
      const clientSession = localStorage.getItem('eitaxi_client_session');
      if (clientSession) {
        fetch('/api/auth/client/session')
          .then(res => res.json())
          .then(data => {
            if (data.authenticated) {
              setServerSessionValid(true);
              router.replace('/cuenta');
            } else {
              localStorage.removeItem('eitaxi_client_session');
              setServerSessionValid(false);
            }
          })
          .catch(() => {
            localStorage.removeItem('eitaxi_client_session');
            setServerSessionValid(false);
          });
      }
    }

    // If no session at all, don't show loading spinner
    if (!loading && !session && !localStorage.getItem('eitaxi_client_session')) {
      setServerSessionValid(false);
    }
  }, [loading, session, redirectToDashboard, router, serverSessionValid]);

  // Show spinner while checking both local and server sessions
  if (loading || (redirectToDashboard && (session || localStorage.getItem('eitaxi_client_session')) && serverSessionValid === null)) {
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
  const [serverValidated, setServerValidated] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading && session && serverValidated === null) {
      fetch('/api/auth/session')
        .then(res => res.json())
        .then(data => {
          if (data.authenticated) {
            setServerValidated(true);
          } else {
            setServerValidated(false);
            localStorage.removeItem('eitaxi_session');
            localStorage.removeItem('eitaxi_driver_id');
            router.replace('/login');
          }
        })
        .catch(() => {
          setServerValidated(false);
          router.replace('/login');
        });
    }
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session, serverValidated, router]);

  if (loading || serverValidated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!session || serverValidated === false) {
    return null;
  }

  return <>{children}</>;
}
