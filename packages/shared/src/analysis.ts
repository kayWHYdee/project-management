import { z } from 'zod';
import { systemTypeSchema } from './enums';
import { sumMoney, sumQuantity } from './money';

/** One entry of the chosen item, wherever it was sent across all projects. */
export const analysisRowSchema = z.object({
  entryId: z.string(),
  projectId: z.string(),
  projectName: z.string(),
  clientName: z.string(),
  systemLabel: z.string(),
  systemType: systemTypeSchema,
  description: z.string().nullable(),
  quantity: z.string(),
  unit: z.string().nullable(),
  sentOn: z.string(),
  amount: z.string().nullable(),
});
export type AnalysisRow = z.infer<typeof analysisRowSchema>;

export const analysisSummarySchema = z.object({
  totalQuantity: z.string(),
  projectCount: z.number().int(),
  totalValue: z.string(),
});
export type AnalysisSummary = z.infer<typeof analysisSummarySchema>;

export const analysisResultSchema = z.object({
  summary: analysisSummarySchema,
  rows: z.array(analysisRowSchema),
});
export type AnalysisResult = z.infer<typeof analysisResultSchema>;

export interface AnalysisFilters {
  clientId?: string;
  status?: string;
  systemType?: string;
  from?: string;
  to?: string;
}

/** Total quantity, distinct project count, and total value across the rows. */
export function summariseAnalysisRows(
  rows: readonly { projectId: string; quantity: string; amount: string | null }[],
): AnalysisSummary {
  return {
    totalQuantity: sumQuantity(rows.map((r) => r.quantity)),
    projectCount: new Set(rows.map((r) => r.projectId)).size,
    totalValue: sumMoney(rows.filter((r) => r.amount !== null).map((r) => r.amount as string)),
  };
}
