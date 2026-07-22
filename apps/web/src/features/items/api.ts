import { itemListSchema, itemSchema, type CreateItemRequest, type Item } from '@water-pm/shared';
import { api } from '@/lib/api';

export const itemsApi = {
  list: (includeInactive = false): Promise<Item[]> =>
    api.get(`/items${includeInactive ? '?includeInactive=true' : ''}`, itemListSchema),
  create: (body: CreateItemRequest): Promise<Item> => api.post('/items', body, itemSchema),
};
