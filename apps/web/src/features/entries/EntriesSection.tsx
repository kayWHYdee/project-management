import { formatInr, type Entry, type System } from '@water-pm/shared';
import { Trash2 } from 'lucide-react';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AddEntryDialog } from './AddEntryDialog';
import { useDeleteEntry, useEntries } from './hooks';

interface EntriesSectionProps {
  projectId: string;
  systems: System[];
  canWrite: boolean;
}

export function EntriesSection({ projectId, systems, canWrite }: EntriesSectionProps) {
  const entries = useEntries(projectId);
  const deleteEntry = useDeleteEntry(projectId);

  const bySystem = new Map<string, Entry[]>();
  for (const entry of entries.data ?? []) {
    const list = bySystem.get(entry.systemId) ?? [];
    list.push(entry);
    bySystem.set(entry.systemId, list);
  }
  const total = entries.data?.length ?? 0;
  const deleteError = deleteEntry.error instanceof ApiError ? deleteEntry.error.message : null;

  const onDelete = (id: string) => {
    if (window.confirm('Delete this entry?')) deleteEntry.mutate(id);
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Entries ({total})</h2>
        {canWrite && <AddEntryDialog projectId={projectId} systems={systems} canAdd={canWrite} />}
      </div>

      {deleteError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {deleteError}
        </p>
      )}

      {total === 0 && !entries.isPending && (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No entries yet. {canWrite ? 'Add what you have sent to this project.' : ''}
        </p>
      )}

      {systems.map((system) => {
        const rows = bySystem.get(system.id);
        if (!rows || rows.length === 0) return null;
        return (
          <div key={system.id} className="rounded-lg border">
            <div className="border-b bg-secondary/40 px-3 py-2 text-sm font-medium">
              {system.label}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Sent on</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  {canWrite && <TableHead />}
                </TableRow>
              </TableHeader>
              <TableBody>
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
                    {canWrite && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(entry.id)}
                          aria-label="Delete entry"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );
      })}
    </section>
  );
}
