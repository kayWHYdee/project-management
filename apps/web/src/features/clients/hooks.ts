import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateClientRequest, UpdateClientRequest } from '@water-pm/shared';
import { clientsApi } from './api';

const clientsKey = (search?: string) => ['clients', search ?? ''] as const;

export function useClients(search?: string) {
  return useQuery({ queryKey: clientsKey(search), queryFn: () => clientsApi.list(search) });
}

export function useClient(id: string) {
  return useQuery({ queryKey: ['client', id], queryFn: () => clientsApi.get(id) });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateClientRequest) => clientsApi.create(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateClientRequest }) =>
      clientsApi.update(id, body),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['clients'] });
      void queryClient.invalidateQueries({ queryKey: ['client', id] });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });
}
