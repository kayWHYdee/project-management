import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateItemRequest, Item, UpdateItemRequest } from '@water-pm/shared';
import { itemsApi } from './api';

export function useItems(includeInactive = false) {
  return useQuery({
    queryKey: ['items', includeInactive],
    queryFn: () => itemsApi.list(includeInactive),
    // The catalog changes rarely; keep it warm so the picker is instant.
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useManagedItems() {
  return useQuery({ queryKey: ['managed-items'], queryFn: itemsApi.listManaged });
}

/** Invalidates every item query (picker lists + managed list). */
function useItemInvalidation() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['items'] });
    void queryClient.invalidateQueries({ queryKey: ['managed-items'] });
  };
}

export function useCreateItem() {
  const invalidate = useItemInvalidation();
  return useMutation<Item, Error, CreateItemRequest>({
    mutationFn: (body) => itemsApi.create(body),
    onSuccess: invalidate,
  });
}

export function useUpdateItem() {
  const invalidate = useItemInvalidation();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateItemRequest }) =>
      itemsApi.update(id, body),
    onSuccess: invalidate,
  });
}

export function useMergeItem() {
  const invalidate = useItemInvalidation();
  return useMutation({
    mutationFn: ({ id, targetItemId }: { id: string; targetItemId: string }) =>
      itemsApi.merge(id, targetItemId),
    onSuccess: () => {
      invalidate();
    },
  });
}
