import { LogOut } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useLogout, useSession } from '@/features/auth/hooks';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground',
  );

export function AppShell() {
  const { user } = useSession();
  const logout = useLogout();
  const navigate = useNavigate();

  const onLogout = () => {
    logout.mutate(undefined, { onSuccess: () => navigate('/login', { replace: true }) });
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-1">
            <span className="mr-3 font-semibold">uniquepm</span>
            <NavLink to="/" end className={navLinkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/clients" className={navLinkClass}>
              Clients
            </NavLink>
            <NavLink to="/projects" className={navLinkClass}>
              Projects
            </NavLink>
            <NavLink to="/items" className={navLinkClass}>
              Items
            </NavLink>
            <NavLink to="/employees" className={navLinkClass}>
              Man Power
            </NavLink>
            <NavLink to="/analysis" className={navLinkClass}>
              Analysis
            </NavLink>
            {user?.role === 'OWNER' && (
              <NavLink to="/settings/users" className={navLinkClass}>
                Users
              </NavLink>
            )}
            <NavLink to="/settings/password" className={navLinkClass}>
              Password
            </NavLink>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{user?.name}</span>
            <Button variant="ghost" size="sm" onClick={onLogout} disabled={logout.isPending}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
