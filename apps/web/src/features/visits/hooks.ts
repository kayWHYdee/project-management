import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateVisitRequest, UpdateVisitRequest } from '@water-pm/shared';
import { visitsApi } from './api';

export function useVisits(projectId: string) {
  return useQuery({
    queryKey: ['visits', projectId],
    queryFn: () => visitsApi.listForProject(projectId),
  });
}

/** Visits touch the project's list, the employee list (visit counts) and any open employee page. */
function useVisitInvalidation(projectId: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['visits', projectId] });
    void queryClient.invalidateQueries({ queryKey: ['employees'] });
    void queryClient.invalidateQueries({ queryKey: ['employee'] });
  };
}

export function useCreateVisit(projectId: string) {
  const invalidate = useVisitInvalidation(projectId);
  return useMutation({
    mutationFn: (body: CreateVisitRequest) => visitsApi.create(projectId, body),
    onSuccess: invalidate,
  });
}

export function useUpdateVisit(projectId: string) {
  const invalidate = useVisitInvalidation(projectId);
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateVisitRequest }) =>
      visitsApi.update(id, body),
    onSuccess: invalidate,
  });
}

export function useDeleteVisit(projectId: string) {
  const invalidate = useVisitInvalidation(projectId);
  return useMutation({
    mutationFn: (id: string) => visitsApi.remove(id),
    onSuccess: invalidate,
  });
}
