import { photoReceivedLabel, type Visit } from '@water-pm/shared';
import { ArrowLeft, Pencil } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EditEmployeeDialog } from '@/features/employees/EditEmployeeDialog';
import { useEmployee } from '@/features/employees/hooks';
import { EditVisitDialog } from '@/features/visits/EditVisitDialog';
import { useCanWrite } from '@/features/auth/hooks';

export function EmployeeDetailPage() {
  const { id = '' } = useParams();
  const canWrite = useCanWrite();
  const employee = useEmployee(id);
  const [editing, setEditing] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);

  if (employee.isPending) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (employee.isError || !employee.data) {
    return <p className="text-sm text-destructive">Employee not found.</p>;
  }
  const data = employee.data;

  return (
    <div className="space-y-6">
      <Link
        to="/employees"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Man Power
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{data.name}</h1>
            {data.role && <Badge variant="muted">{data.role}</Badge>}
            {!data.isActive && <Badge variant="muted">Inactive</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">Mobile: {data.mobile ?? 'not set'}</p>
        </div>
        {canWrite && (
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
        )}
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Projects visited ({data.visits.length})</h2>
        {data.visits.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No visits recorded for this employee yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>System</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead>Photo</TableHead>
                  {canWrite && <TableHead />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.visits.map((visit) => (
                  <TableRow key={visit.id}>
                    <TableCell className="font-medium">
                      <Link to={`/projects/${visit.projectId}`} className="underline">
                        {visit.projectName}
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
                        <Button variant="ghost" size="sm" onClick={() => setEditingVisit(visit)}>
                          Edit
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {editing && (
        <EditEmployeeDialog key={data.version} employee={data} onClose={() => setEditing(false)} />
      )}
      {editingVisit && (
        <EditVisitDialog
          key={editingVisit.id}
          visit={editingVisit}
          onClose={() => setEditingVisit(null)}
        />
      )}
    </div>
  );
}
