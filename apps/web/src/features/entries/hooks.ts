import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateEntryRequest } from '@water-pm/shared';
import { entriesApi } from './api';

export function useEntries(projectId: string) {
  return useQuery({
    queryKey: ['entries', projectId],
    queryFn: () => entriesApi.listForProject(projectId),
  });
}

/** Invalidates the entry list and the project summary (rollups + financials). */
function useEntryInvalidation(projectId: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['entries', projectId] });
    void queryClient.invalidateQueries({ queryKey: ['project-summary', projectId] });
  };
}

export function useCreateEntry(projectId: string) {
  const invalidate = useEntryInvalidation(projectId);
  return useMutation({
    mutationFn: (body: CreateEntryRequest) => entriesApi.create(body),
    onSuccess: invalidate,
  });
}

export function useDeleteEntry(projectId: string) {
  const invalidate = useEntryInvalidation(projectId);
  return useMutation({
    mutationFn: (id: string) => entriesApi.remove(id),
    onSuccess: invalidate,
  });
}
