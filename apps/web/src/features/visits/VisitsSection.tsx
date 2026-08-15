import { photoReceivedLabel, type System, type Visit } from '@water-pm/shared';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
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
import { AddVisitDialog } from './AddVisitDialog';
import { EditVisitDialog } from './EditVisitDialog';
import { useDeleteVisit, useVisits } from './hooks';

export function VisitsSection({
  projectId,
  systems,
  canWrite,
}: {
  projectId: string;
  systems: System[];
  canWrite: boolean;
}) {
  const visits = useVisits(projectId);
  const deleteVisit = useDeleteVisit(projectId);
  const deleteError = deleteVisit.error instanceof ApiError ? deleteVisit.error.message : null;
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);

  const onDelete = (id: string) => {
    if (window.confirm('Delete this visit?')) deleteVisit.mutate(id);
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Site visits ({visits.data?.length ?? 0})</h2>
        {canWrite && <AddVisitDialog projectId={projectId} systems={systems} />}
      </div>

      {deleteError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {deleteError}
        </p>
      )}

      {visits.data?.length === 0 && !visits.isPending ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No site visits recorded.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>System</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Hours</TableHead>
                <TableHead>Photo</TableHead>
                {canWrite && <TableHead />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visits.data?.map((visit) => (
                <TableRow key={visit.id}>
                  <TableCell className="font-medium">
                    <Link to={`/employees/${visit.employeeId}`} className="underline">
                      {visit.employeeName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{visit.purpose ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {visit.systemLabel ?? '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{visit.visitDate}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {visit.hours ?? '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {photoReceivedLabel(visit.photoReceived)}
                  </TableCell>
                  {canWrite && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingVisit(visit)}
                          aria-label="Edit visit"
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(visit.id)}
                          aria-label="Delete visit"
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
        </div>
      )}

      {editingVisit && (
        <EditVisitDialog
          key={editingVisit.id}
          visit={editingVisit}
          systems={systems}
          onClose={() => setEditingVisit(null)}
        />
      )}
    </section>
  );
}
