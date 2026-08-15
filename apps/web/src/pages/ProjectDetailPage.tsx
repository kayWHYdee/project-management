import {
  AUTO_SYSTEM_TYPES,
  formatInr,
  humaniseSystemType,
  type ProjectStatus,
  type System,
} from '@water-pm/shared';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { StatTile } from '@/components/ui/stat-tile';
import { PROJECT_STATUSES, projectStatusLabel } from '@/lib/project-status';
import { AddSystemDialog } from '@/features/projects/AddSystemDialog';
import { EditProjectDialog } from '@/features/projects/EditProjectDialog';
import { EditSystemDialog } from '@/features/projects/EditSystemDialog';
import {
  useDeleteProject,
  useDeleteSystem,
  useProject,
  useProjectSummary,
  useUpdateProject,
} from '@/features/projects/hooks';
import { EntriesSection } from '@/features/entries/EntriesSection';
import { ItemRollupTable } from '@/features/entries/ItemRollupTable';
import { ExpensesSection } from '@/features/expenses/ExpensesSection';
import { PaymentsSection } from '@/features/payments/PaymentsSection';
import { useCanWrite } from '@/features/auth/hooks';

export function ProjectDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const canWrite = useCanWrite();
  const project = useProject(id);
  const summary = useProjectSummary(id);
  const updateProject = useUpdateProject(id);
  const deleteProject = useDeleteProject();
  const deleteSystem = useDeleteSystem(id);
  const [editingProject, setEditingProject] = useState(false);
  const [editingSystem, setEditingSystem] = useState<System | null>(null);

  if (project.isPending) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (project.isError || !project.data) {
    return <p className="text-sm text-destructive">Project not found.</p>;
  }
  const data = project.data;
  const financials = summary.data?.financials;

  const onStatusChange = (status: ProjectStatus) => {
    updateProject.mutate({ version: data.version, status });
  };

  const onDeleteProject = () => {
    if (!window.confirm('Delete this project and its systems?')) return;
    deleteProject.mutate(id, { onSuccess: () => navigate('/projects', { replace: true }) });
  };

  const onDeleteSystem = (systemId: string) => {
    if (!window.confirm('Remove this system?')) return;
    deleteSystem.mutate(systemId);
  };

  const actionError = [updateProject.error, deleteSystem.error, deleteProject.error].find(
    (error): error is ApiError => error instanceof ApiError,
  );

  return (
    <div className="space-y-6">
      <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Projects
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{data.name}</h1>
          <Link
            to={`/clients/${data.clientId}`}
            className="text-sm text-muted-foreground underline"
          >
            {data.clientName}
          </Link>
          <p className="text-sm text-muted-foreground">Start date: {data.startDate ?? 'not set'}</p>
        </div>
        <div className="flex items-center gap-2">
          {canWrite ? (
            <Select
              className="h-9 w-48"
              value={data.status}
              disabled={updateProject.isPending}
              onChange={(event) => onStatusChange(event.target.value as ProjectStatus)}
            >
              {PROJECT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {projectStatusLabel(status)}
                </option>
              ))}
            </Select>
          ) : (
            <Badge>{projectStatusLabel(data.status)}</Badge>
          )}
          {canWrite && (
            <Button variant="outline" onClick={() => setEditingProject(true)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
          )}
          {canWrite && (
            <Button variant="outline" onClick={onDeleteProject} disabled={deleteProject.isPending}>
              Delete
            </Button>
          )}
        </div>
      </div>

      {actionError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError.message}
        </p>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Budget"
            value={financials?.budget ? formatInr(financials.budget) : '—'}
          />
          <StatTile
            label="Spent (materials + expenses)"
            value={financials ? formatInr(financials.totalSpent) : '—'}
          />
          <StatTile
            label="Remaining"
            value={financials?.remaining ? formatInr(financials.remaining) : '—'}
            highlight={financials?.remaining ? financials.remaining.startsWith('-') : false}
          />
          <StatTile
            label="Payments received"
            value={financials ? formatInr(financials.paymentsReceived) : '—'}
          />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">Description</h2>
        {data.description ? (
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{data.description}</p>
        ) : (
          <p className="text-sm text-muted-foreground">No description yet.</p>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Systems</h2>
          {canWrite && <AddSystemDialog projectId={id} />}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {data.systems.map((system) => {
            const isAuto = AUTO_SYSTEM_TYPES.includes(system.type);
            return (
              <Card key={system.id} className="transition-colors hover:bg-secondary/40">
                <CardContent className="flex items-start justify-between gap-2 p-4">
                  <Link to={`/projects/${id}/systems/${system.id}`} className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{system.label}</span>
                      <Badge variant="muted">{humaniseSystemType(system.type)}</Badge>
                    </div>
                    {system.notes && (
                      <p className="mt-1 text-xs text-muted-foreground">{system.notes}</p>
                    )}
                  </Link>
                  {canWrite && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingSystem(system)}
                        aria-label="Edit system"
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      {!isAuto && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteSystem(system.id)}
                          aria-label="Remove system"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Item summary</h2>
        <ItemRollupTable projectId={id} rollups={summary.data?.itemRollups ?? []} />
      </section>

      <EntriesSection projectId={id} systems={data.systems} canWrite={canWrite} />

      <ExpensesSection projectId={id} canWrite={canWrite} />

      <PaymentsSection projectId={id} canWrite={canWrite} />

      {editingProject && (
        <EditProjectDialog
          key={data.version}
          project={data}
          onClose={() => setEditingProject(false)}
        />
      )}
      {editingSystem && (
        <EditSystemDialog
          key={editingSystem.id}
          projectId={id}
          system={editingSystem}
          onClose={() => setEditingSystem(null)}
        />
      )}
    </div>
  );
}
