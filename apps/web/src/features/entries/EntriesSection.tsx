import { formatInr, type Entry, type System } from '@water-pm/shared';
import { ChevronDown, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { EditEntryDialog } from './EditEntryDialog';
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
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Entry | null>(null);

  const bySystem = new Map<string, Entry[]>();
  for (const entry of entries.data ?? []) {
    const list = bySystem.get(entry.systemId) ?? [];
    list.push(entry);
    bySystem.set(entry.systemId, list);
  }
  const total = entries.data?.length ?? 0;
  const deleteError = deleteEntry.error instanceof ApiError ? deleteEntry.error.message : null;

  const toggle = (systemId: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(systemId)) next.delete(systemId);
      else next.add(systemId);
      return next;
    });

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
        const isOpen = expanded.has(system.id);
        return (
          <div key={system.id} className="rounded-lg border">
            <button
              type="button"
              onClick={() => toggle(system.id)}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium hover:bg-secondary/40"
            >
              <span className="inline-flex items-center gap-1.5">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                {system.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {rows.length} {rows.length === 1 ? 'entry' : 'entries'}
              </span>
            </button>
            {isOpen && (
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
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditing(entry)}
                              aria-label="Edit entry"
                            >
                              <Pencil className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDelete(entry.id)}
                              aria-label="Delete entry"
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        );
      })}

      {editing && (
        <EditEntryDialog
          key={editing.id}
          projectId={projectId}
          entry={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}
