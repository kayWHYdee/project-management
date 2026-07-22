import { useQuery } from '@tanstack/react-query';
import { healthResponseSchema } from '@water-pm/shared';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from '@/features/auth/hooks';

export function DashboardPage() {
  const { user } = useSession();
  const health = useQuery({
    queryKey: ['health'],
    queryFn: () => api.get('/health', healthResponseSchema),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Signed in as {user?.name} · {user?.role}
        </p>
      </div>

      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle className="text-base">API health</CardTitle>
        </CardHeader>
        <CardContent>
          <span
            className={
              health.data?.status === 'ok'
                ? 'text-sm font-medium text-emerald-600'
                : 'text-sm text-muted-foreground'
            }
          >
            {health.isPending ? 'Checking…' : health.data?.status === 'ok' ? 'OK' : 'Unreachable'}
          </span>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Clients, projects and entries arrive in the next phases.
      </p>
    </div>
  );
}
