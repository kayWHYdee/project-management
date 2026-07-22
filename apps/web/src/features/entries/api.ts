import {
  entryListSchema,
  entrySchema,
  type CreateEntryRequest,
  type Entry,
  type UpdateEntryRequest,
} from '@water-pm/shared';
import { api } from '@/lib/api';

export const entriesApi = {
  listForProject: (projectId: string): Promise<Entry[]> =>
    api.get(`/projects/${projectId}/entries`, entryListSchema),
  create: (body: CreateEntryRequest): Promise<Entry> => api.post('/entries', body, entrySchema),
  update: (id: string, body: UpdateEntryRequest): Promise<Entry> =>
    api.patch(`/entries/${id}`, body, entrySchema),
  remove: (id: string): Promise<void> => api.delete(`/entries/${id}`),
};
