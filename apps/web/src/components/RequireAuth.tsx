import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSession } from '@/features/auth/hooks';
import { AppShell } from './AppShell';

/** Gate for authenticated routes: waits for the session, then renders the shell or redirects. */
export function RequireAuth() {
  const { isAuthenticated, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AppShell />;
}

/** Gate for OWNER-only routes; redirects non-owners home. */
export function RequireOwner({ children }: { children: ReactNode }) {
  const { user } = useSession();
  if (user?.role !== 'OWNER') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
