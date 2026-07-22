import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateProjectRequest,
  CreateSystemRequest,
  UpdateProjectRequest,
} from '@water-pm/shared';
import { projectsApi, type ProjectListFilter } from './api';
import { systemsApi } from '../systems/api';

export function useProjects(filter: ProjectListFilter = {}) {
  return useQuery({
    queryKey: ['projects', filter],
    queryFn: () => projectsApi.list(filter),
  });
}

export function useProject(id: string) {
  return useQuery({ queryKey: ['project', id], queryFn: () => projectsApi.get(id) });
}

export function useProjectSummary(id: string) {
  return useQuery({
    queryKey: ['project-summary', id],
    queryFn: () => projectsApi.summary(id),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateProjectRequest) => projectsApi.create(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useUpdateProject(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateProjectRequest) => projectsApi.update(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
      void queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useAddSystem(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateSystemRequest) => projectsApi.addSystem(projectId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project', projectId] }),
  });
}

export function useDeleteSystem(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (systemId: string) => systemsApi.remove(systemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project', projectId] }),
  });
}
