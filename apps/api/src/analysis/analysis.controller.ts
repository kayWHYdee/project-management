import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  isoDateSchema,
  projectStatusSchema,
  systemTypeSchema,
  type AnalysisResult,
} from '@water-pm/shared';
import { AnalysisService } from './analysis.service';

@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysis: AnalysisService) {}

  @Get('item/:itemId')
  forItem(
    @Param('itemId') itemId: string,
    @Query('clientId') clientId?: string,
    @Query('status') status?: string,
    @Query('systemType') systemType?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<AnalysisResult> {
    // Invalid filter values are ignored rather than rejected.
    const parsedStatus = status ? projectStatusSchema.safeParse(status) : undefined;
    const parsedType = systemType ? systemTypeSchema.safeParse(systemType) : undefined;
    const parsedFrom = from ? isoDateSchema.safeParse(from) : undefined;
    const parsedTo = to ? isoDateSchema.safeParse(to) : undefined;

    return this.analysis.forItem(itemId, {
      clientId: clientId?.trim() || undefined,
      status: parsedStatus?.success ? parsedStatus.data : undefined,
      systemType: parsedType?.success ? parsedType.data : undefined,
      from: parsedFrom?.success ? parsedFrom.data : undefined,
      to: parsedTo?.success ? parsedTo.data : undefined,
    });
  }
}
