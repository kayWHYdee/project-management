import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateEmployeeRequest, UpdateEmployeeRequest } from '@water-pm/shared';
import { employeesApi } from './api';

export function useEmployees(search?: string) {
  return useQuery({
    queryKey: ['employees', search ?? ''],
    queryFn: () => employeesApi.list(search),
  });
}

export function useEmployee(id: string) {
  return useQuery({ queryKey: ['employee', id], queryFn: () => employeesApi.get(id) });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateEmployeeRequest) => employeesApi.create(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  });
}

export function useUpdateEmployee(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateEmployeeRequest) => employeesApi.update(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
      void queryClient.invalidateQueries({ queryKey: ['employee', id] });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  });
}
