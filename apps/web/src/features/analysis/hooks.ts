import { useQuery } from '@tanstack/react-query';
import type { AnalysisFilters } from '@water-pm/shared';
import { analysisApi } from './api';

export function useAnalysis(itemId: string | null, filters: AnalysisFilters) {
  return useQuery({
    queryKey: ['analysis', itemId, filters],
    queryFn: () => analysisApi.forItem(itemId as string, filters),
    enabled: !!itemId,
  });
}
