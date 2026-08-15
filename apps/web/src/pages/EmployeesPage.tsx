import type { Employee } from '@water-pm/shared';
import { useState } from 'react';
import { Link } from 'react-router-dom';
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
import { AddEmployeeDialog } from '@/features/employees/AddEmployeeDialog';
import { EditEmployeeDialog } from '@/features/employees/EditEmployeeDialog';
import { useEmployees } from '@/features/employees/hooks';
import { useCanWrite } from '@/features/auth/hooks';

export function EmployeesPage() {
  const canWrite = useCanWrite();
  const employees = useEmployees();
  const [editing, setEditing] = useState<Employee | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Man Power</h1>
          <p className="text-sm text-muted-foreground">
            Field staff sent to project sites. Click a name to see the projects they visited.
          </p>
        </div>
        {canWrite && <AddEmployeeDialog />}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead className="text-right">Visits</TableHead>
              <TableHead>Status</TableHead>
              {canWrite && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.isPending && (
              <TableRow>
                <TableCell
                  colSpan={canWrite ? 6 : 5}
                  className="py-6 text-center text-muted-foreground"
                >
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {employees.data?.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={canWrite ? 6 : 5}
                  className="py-6 text-center text-muted-foreground"
                >
                  No employees yet.
                </TableCell>
              </TableRow>
            )}
            {employees.data?.map((employee) => (
              <TableRow key={employee.id} className={employee.isActive ? undefined : 'opacity-60'}>
                <TableCell className="font-medium">
                  <Link to={`/employees/${employee.id}`} className="underline">
                    {employee.name}
                  </Link>
                </TableCell>
                <TableCell>
                  {employee.role ? (
                    <Badge variant="muted">{employee.role}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{employee.mobile ?? '—'}</TableCell>
                <TableCell className="text-right">{employee.visitCount}</TableCell>
                <TableCell>
                  {employee.isActive ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Badge variant="muted">Inactive</Badge>
                  )}
                </TableCell>
                {canWrite && (
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(employee)}>
                      Edit
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editing && (
        <EditEmployeeDialog key={editing.id} employee={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
