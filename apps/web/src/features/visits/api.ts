import {
  visitListSchema,
  visitSchema,
  type CreateVisitRequest,
  type UpdateVisitRequest,
  type Visit,
} from '@water-pm/shared';
import { api } from '@/lib/api';

export const visitsApi = {
  listForProject: (projectId: string): Promise<Visit[]> =>
    api.get(`/projects/${projectId}/visits`, visitListSchema),
  create: (projectId: string, body: CreateVisitRequest): Promise<Visit> =>
    api.post(`/projects/${projectId}/visits`, body, visitSchema),
  update: (id: string, body: UpdateVisitRequest): Promise<Visit> =>
    api.patch(`/visits/${id}`, body, visitSchema),
  remove: (id: string): Promise<void> => api.delete(`/visits/${id}`),
};
