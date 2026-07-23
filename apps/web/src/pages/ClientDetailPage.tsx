import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { projectStatusLabel, projectStatusVariant } from '@/lib/project-status';
import { EditClientDialog } from '@/features/clients/EditClientDialog';
import { CreateProjectDialog } from '@/features/projects/CreateProjectDialog';
import { useClient, useDeleteClient } from '@/features/clients/hooks';
import { useProjects } from '@/features/projects/hooks';
import { useCanWrite } from '@/features/auth/hooks';

export function ClientDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const canWrite = useCanWrite();
  const client = useClient(id);
  const projects = useProjects({ clientId: id });
  const deleteClient = useDeleteClient();
  const [editing, setEditing] = useState(false);

  const onDelete = () => {
    if (!window.confirm('Delete this client?')) return;
    deleteClient.mutate(id, { onSuccess: () => navigate('/clients', { replace: true }) });
  };

  const deleteError = deleteClient.error instanceof ApiError ? deleteClient.error.message : null;

  if (client.isPending) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (client.isError || !client.data) {
    return <p className="text-sm text-destructive">Client not found.</p>;
  }

  return (
    <div className="space-y-6">
      <Link to="/clients" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Clients
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{client.data.name}</h1>
          <p className="text-sm text-muted-foreground">
            {[client.data.contact, client.data.phone, client.data.email]
              .filter(Boolean)
              .join(' · ') || 'No contact details'}
          </p>
        </div>
        {canWrite && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button variant="outline" onClick={onDelete} disabled={deleteClient.isPending}>
              Delete client
            </Button>
          </div>
        )}
      </div>

      {editing && <EditClientDialog client={client.data} onClose={() => setEditing(false)} />}

      {deleteError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {deleteError}
        </p>
      )}

      {client.data.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">
            {client.data.notes}
          </CardContent>
        </Card>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium">Projects</h2>
          {canWrite && <CreateProjectDialog defaultClientId={id} />}
        </div>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.data?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="py-6 text-center text-muted-foreground">
                    No projects for this client yet.
                  </TableCell>
                </TableRow>
              )}
              {projects.data?.map((project) => (
                <TableRow
                  key={project.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>
                    <Badge variant={projectStatusVariant(project.status)}>
                      {projectStatusLabel(project.status)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
