import type { Project, ProjectStatus } from '@water-pm/shared';
import { useNavigate } from 'react-router-dom';
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
import { PROJECT_STATUSES, projectStatusLabel, projectStatusVariant } from '@/lib/project-status';
import { useProjects } from '@/features/projects/hooks';
import { useSession } from '@/features/auth/hooks';

function countByStatus(projects: Project[]): Record<ProjectStatus, number> {
  const counts = Object.fromEntries(PROJECT_STATUSES.map((s) => [s, 0])) as Record<
    ProjectStatus,
    number
  >;
  for (const project of projects) {
    counts[project.status] += 1;
  }
  return counts;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useSession();
  const projects = useProjects();

  const counts = projects.data ? countByStatus(projects.data) : undefined;
  const recent = projects.data?.slice(0, 6) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Signed in as {user?.name} · {user?.role}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {PROJECT_STATUSES.map((status) => (
          <StatTile
            key={status}
            size="lg"
            label={projectStatusLabel(status)}
            value={counts ? String(counts[status]) : '–'}
          />
        ))}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium">Recently updated projects</h2>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.isPending && (
                <TableRow>
                  <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {projects.data?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
                    No projects yet — add a client, then a project.
                  </TableCell>
                </TableRow>
              )}
              {recent.map((project) => (
                <TableRow
                  key={project.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell className="text-muted-foreground">{project.clientName}</TableCell>
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
