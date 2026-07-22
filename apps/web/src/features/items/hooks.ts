import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateItemRequest, Item } from '@water-pm/shared';
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

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation<Item, Error, CreateItemRequest>({
    mutationFn: (body) => itemsApi.create(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
  });
}
