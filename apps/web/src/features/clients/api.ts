import {
  clientListSchema,
  clientSchema,
  type Client,
  type CreateClientRequest,
  type UpdateClientRequest,
} from '@water-pm/shared';
import { api } from '@/lib/api';

export const clientsApi = {
  list: (search?: string): Promise<Client[]> =>
    api.get(`/clients${search ? `?search=${encodeURIComponent(search)}` : ''}`, clientListSchema),
  get: (id: string): Promise<Client> => api.get(`/clients/${id}`, clientSchema),
  create: (body: CreateClientRequest): Promise<Client> => api.post('/clients', body, clientSchema),
  update: (id: string, body: UpdateClientRequest): Promise<Client> =>
    api.patch(`/clients/${id}`, body, clientSchema),
  remove: (id: string): Promise<void> => api.delete(`/clients/${id}`),
};
