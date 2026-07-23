import { analysisResultSchema, type AnalysisFilters, type AnalysisResult } from '@water-pm/shared';
import { api } from '@/lib/api';

function toQuery(filters: AnalysisFilters): string {
  const params = new URLSearchParams();
  if (filters.clientId) params.set('clientId', filters.clientId);
  if (filters.status) params.set('status', filters.status);
  if (filters.systemType) params.set('systemType', filters.systemType);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  const query = params.toString();
  return query ? `?${query}` : '';
}

export const analysisApi = {
  forItem: (itemId: string, filters: AnalysisFilters): Promise<AnalysisResult> =>
    api.get(`/analysis/item/${itemId}${toQuery(filters)}`, analysisResultSchema),
};
