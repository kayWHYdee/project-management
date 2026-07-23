import {
  paymentListSchema,
  paymentSchema,
  type CreatePaymentRequest,
  type Payment,
} from '@water-pm/shared';
import { api } from '@/lib/api';

export const paymentsApi = {
  listForProject: (projectId: string): Promise<Payment[]> =>
    api.get(`/projects/${projectId}/payments`, paymentListSchema),
  create: (projectId: string, body: CreatePaymentRequest): Promise<Payment> =>
    api.post(`/projects/${projectId}/payments`, body, paymentSchema),
  remove: (id: string): Promise<void> => api.delete(`/payments/${id}`),
};
