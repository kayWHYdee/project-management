import { systemSchema, type System, type UpdateSystemRequest } from '@water-pm/shared';
import { api } from '@/lib/api';

export const systemsApi = {
  update: (id: string, body: UpdateSystemRequest): Promise<System> =>
    api.patch(`/systems/${id}`, body, systemSchema),
  remove: (id: string): Promise<void> => api.delete(`/systems/${id}`),
};
