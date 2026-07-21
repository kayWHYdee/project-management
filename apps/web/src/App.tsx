import { useQuery } from '@tanstack/react-query';
import { healthResponseSchema } from '@water-pm/shared';
import { apiGet } from '@/lib/api';
import { cn } from '@/lib/utils';

function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => apiGet('/health', healthResponseSchema),
  });
}

export function App() {
  const { data, isPending, isError, error, refetch, isFetching } = useHealth();

  const statusOk = data?.status === 'ok';

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Water PM</h1>
        <p className="text-sm text-muted-foreground">Project management — Phase 1 scaffold</p>
      </div>

      <div className="w-full rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">API health</span>
          <span
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium',
              isPending && 'bg-muted text-muted-foreground',
              isError && 'bg-destructive/10 text-destructive',
              statusOk && 'bg-emerald-100 text-emerald-700',
            )}
          >
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                isPending && 'bg-muted-foreground',
                isError && 'bg-destructive',
                statusOk && 'bg-emerald-500',
              )}
            />
            {isPending ? 'Checking…' : isError ? 'Unreachable' : 'OK'}
          </span>
        </div>

        {statusOk && (
          <dl className="mt-3 space-y-1 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <dt>Service</dt>
              <dd className="font-mono">{data.service}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Server time</dt>
              <dd className="font-mono">{new Date(data.time).toLocaleString()}</dd>
            </div>
          </dl>
        )}

        {isError && <p className="mt-3 text-xs text-destructive">{(error as Error).message}</p>}
      </div>

      <button
        type="button"
        onClick={() => void refetch()}
        disabled={isFetching}
        className="rounded-md border bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {isFetching ? 'Refreshing…' : 'Refresh'}
      </button>
    </main>
  );
}
