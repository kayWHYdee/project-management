import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreatePaymentRequest } from '@water-pm/shared';
import { paymentsApi } from './api';

export function usePayments(projectId: string) {
  return useQuery({
    queryKey: ['payments', projectId],
    queryFn: () => paymentsApi.listForProject(projectId),
  });
}

function usePaymentInvalidation(projectId: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['payments', projectId] });
    void queryClient.invalidateQueries({ queryKey: ['project-summary', projectId] });
  };
}

export function useCreatePayment(projectId: string) {
  const invalidate = usePaymentInvalidation(projectId);
  return useMutation({
    mutationFn: (body: CreatePaymentRequest) => paymentsApi.create(projectId, body),
    onSuccess: invalidate,
  });
}

export function useDeletePayment(projectId: string) {
  const invalidate = usePaymentInvalidation(projectId);
  return useMutation({
    mutationFn: (id: string) => paymentsApi.remove(id),
    onSuccess: invalidate,
  });
}
