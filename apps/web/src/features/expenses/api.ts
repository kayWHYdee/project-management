import {
  expenseListSchema,
  expenseSchema,
  type CreateExpenseRequest,
  type Expense,
} from '@water-pm/shared';
import { api } from '@/lib/api';

export const expensesApi = {
  listForProject: (projectId: string): Promise<Expense[]> =>
    api.get(`/projects/${projectId}/expenses`, expenseListSchema),
  create: (projectId: string, body: CreateExpenseRequest): Promise<Expense> =>
    api.post(`/projects/${projectId}/expenses`, body, expenseSchema),
  remove: (id: string): Promise<void> => api.delete(`/expenses/${id}`),
};
