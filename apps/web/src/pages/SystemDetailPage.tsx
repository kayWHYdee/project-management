import {
  buildItemRollups,
  entryRollupKey,
  formatInr,
  humaniseSystemType,
  sumMoney,
} from '@water-pm/shared';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { StatTile } from '@/components/ui/stat-tile';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useEntries } from '@/features/entries/hooks';
import { useProject } from '@/features/projects/hooks';

export function SystemDetailPage() {
  const { projectId = '', systemId = '' } = useParams();
  const project = useProject(projectId);
  const entries = useEntries(projectId);

  if (project.isPending) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  const system = project.data?.systems.find((s) => s.id === systemId);
  if (!project.data || !system) {
    return <p className="text-sm text-destructive">System not found.</p>;
  }

  const rows = (entries.data ?? []).filter((entry) => entry.systemId === systemId);
  const totalValue = sumMoney(rows.filter((r) => r.amount !== null).map((r) => r.amount as string));
  const rollups = buildItemRollups(
    rows.map((entry) => ({
      key: entryRollupKey(entry),
      name: entry.displayName,
      category: null,
      quantity: entry.quantity,
      amount: entry.amount,
    })),
  );

  return (
    <div className="space-y-6">
      <Link
        to={`/projects/${projectId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {project.data.name}
      </Link>

      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{system.label}</h1>
          <Badge variant="muted">{humaniseSystemType(system.type)}</Badge>
        </div>
        {system.notes && <p className="mt-1 text-sm text-muted-foreground">{system.notes}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatTile label="Entries" value={String(rows.length)} />
        <StatTile label="Total value" value={formatInr(totalValue)} />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Items in this system</h2>
        {rollups.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Nothing recorded for this system yet.
          </p>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Total qty</TableHead>
                  <TableHead className="text-right">Entries</TableHead>
                  <TableHead className="text-right">Total value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rollups.map((rollup) => (
                  <TableRow key={rollup.key}>
                    <TableCell className="font-medium">{rollup.name}</TableCell>
                    <TableCell className="text-right">{rollup.totalQuantity}</TableCell>
                    <TableCell className="text-right">{rollup.entryCount}</TableCell>
                    <TableCell className="text-right">{formatInr(rollup.totalAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Entries</h2>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Sent on</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                    No entries.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.displayName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {entry.description ?? '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.quantity} {entry.unit ?? ''}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{entry.sentOn}</TableCell>
                  <TableCell className="text-right">
                    {entry.amount ? formatInr(entry.amount) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
