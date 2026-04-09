"use client";

import { useEffect } from 'react';
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

  useEffect(() => {
    if (!loading && redirectToDashboard && session) {
      router.replace(`/dashboard/${session.driverId}`);
    }
  }, [loading, session, redirectToDashboard, router]);

  if (loading) {
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
