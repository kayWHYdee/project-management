import {
  itemListSchema,
  itemSchema,
  managedItemListSchema,
  managedItemSchema,
  mergeItemsResultSchema,
  type CreateItemRequest,
  type Item,
  type ManagedItem,
  type MergeItemsResult,
  type UpdateItemRequest,
} from '@water-pm/shared';
import { api } from '@/lib/api';

export const itemsApi = {
  list: (includeInactive = false): Promise<Item[]> =>
    api.get(`/items${includeInactive ? '?includeInactive=true' : ''}`, itemListSchema),
  listManaged: (): Promise<ManagedItem[]> => api.get('/items/managed', managedItemListSchema),
  create: (body: CreateItemRequest): Promise<Item> => api.post('/items', body, itemSchema),
  update: (id: string, body: UpdateItemRequest): Promise<ManagedItem> =>
    api.patch(`/items/${id}`, body, managedItemSchema),
  merge: (id: string, targetItemId: string): Promise<MergeItemsResult> =>
    api.post(`/items/${id}/merge`, { targetItemId }, mergeItemsResultSchema),
};
