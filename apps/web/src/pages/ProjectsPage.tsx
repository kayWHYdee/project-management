import { formatInr } from '@water-pm/shared';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PROJECT_STATUSES, projectStatusLabel, projectStatusVariant } from '@/lib/project-status';
import { CreateProjectDialog } from '@/features/projects/CreateProjectDialog';
import { useProjects } from '@/features/projects/hooks';
import { useCanWrite } from '@/features/auth/hooks';

export function ProjectsPage() {
  const navigate = useNavigate();
  const canWrite = useCanWrite();
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const projects = useProjects({ status: status || undefined, search: search.trim() || undefined });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">Every site and the work happening there.</p>
        </div>
        {canWrite && <CreateProjectDialog />}
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search projects…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="max-w-xs"
        />
        <Select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="max-w-48"
        >
          <option value="">All statuses</option>
          {PROJECT_STATUSES.map((option) => (
            <option key={option} value={option}>
              {projectStatusLabel(option)}
            </option>
          ))}
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Budget</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.isPending && (
              <TableRow>
                <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {projects.data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                  No projects match.
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
                <TableCell className="text-muted-foreground">{project.clientName}</TableCell>
                <TableCell>
                  <Badge variant={projectStatusVariant(project.status)}>
                    {projectStatusLabel(project.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {project.budgetValue ? formatInr(project.budgetValue) : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
