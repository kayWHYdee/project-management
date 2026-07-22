import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateExpenseRequest } from '@water-pm/shared';
import { expensesApi } from './api';

export function useExpenses(projectId: string) {
  return useQuery({
    queryKey: ['expenses', projectId],
    queryFn: () => expensesApi.listForProject(projectId),
  });
}

function useExpenseInvalidation(projectId: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['expenses', projectId] });
    void queryClient.invalidateQueries({ queryKey: ['project-summary', projectId] });
  };
}

export function useCreateExpense(projectId: string) {
  const invalidate = useExpenseInvalidation(projectId);
  return useMutation({
    mutationFn: (body: CreateExpenseRequest) => expensesApi.create(projectId, body),
    onSuccess: invalidate,
  });
}

export function useDeleteExpense(projectId: string) {
  const invalidate = useExpenseInvalidation(projectId);
  return useMutation({
    mutationFn: (id: string) => expensesApi.remove(id),
    onSuccess: invalidate,
  });
}
