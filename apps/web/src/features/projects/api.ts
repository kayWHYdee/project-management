import {
  projectDetailSchema,
  projectListSchema,
  systemSchema,
  type CreateProjectRequest,
  type CreateSystemRequest,
  type Project,
  type ProjectDetail,
  type System,
  type UpdateProjectRequest,
} from '@water-pm/shared';
import { api } from '@/lib/api';

export interface ProjectListFilter {
  status?: string;
  clientId?: string;
  search?: string;
}

function toQuery(filter: ProjectListFilter): string {
  const params = new URLSearchParams();
  if (filter.status) params.set('status', filter.status);
  if (filter.clientId) params.set('clientId', filter.clientId);
  if (filter.search) params.set('search', filter.search);
  const query = params.toString();
  return query ? `?${query}` : '';
}

export const projectsApi = {
  list: (filter: ProjectListFilter = {}): Promise<Project[]> =>
    api.get(`/projects${toQuery(filter)}`, projectListSchema),
  get: (id: string): Promise<ProjectDetail> => api.get(`/projects/${id}`, projectDetailSchema),
  create: (body: CreateProjectRequest): Promise<ProjectDetail> =>
    api.post('/projects', body, projectDetailSchema),
  update: (id: string, body: UpdateProjectRequest): Promise<ProjectDetail> =>
    api.patch(`/projects/${id}`, body, projectDetailSchema),
  remove: (id: string): Promise<void> => api.delete(`/projects/${id}`),
  addSystem: (projectId: string, body: CreateSystemRequest): Promise<System> =>
    api.post(`/projects/${projectId}/systems`, body, systemSchema),
};
