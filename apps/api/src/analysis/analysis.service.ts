import { Injectable } from '@nestjs/common';
import type { Prisma, ProjectStatus, SystemType } from '@prisma/client';
import {
  isoDateToUtcDate,
  summariseAnalysisRows,
  utcDateToIsoDate,
  type AnalysisResult,
  type AnalysisRow,
} from '@water-pm/shared';
import { PrismaService } from '../prisma/prisma.service';

export interface AnalysisQuery {
  clientId?: string;
  status?: ProjectStatus;
  systemType?: SystemType;
  from?: string;
  to?: string;
}

@Injectable()
export class AnalysisService {
  constructor(private readonly prisma: PrismaService) {}

  /** Every entry of a given item across all projects, filtered and summarised. */
  async forItem(itemId: string, query: AnalysisQuery): Promise<AnalysisResult> {
    const sentOn = this.dateRange(query.from, query.to);
    const entries = await this.prisma.entry.findMany({
      where: {
        itemId,
        deletedAt: null,
        ...(sentOn ? { sentOn } : {}),
        system: {
          deletedAt: null,
          ...(query.systemType ? { type: query.systemType } : {}),
          project: {
            deletedAt: null,
            ...(query.clientId ? { clientId: query.clientId } : {}),
            ...(query.status ? { status: query.status } : {}),
          },
        },
      },
      include: { system: { include: { project: { include: { client: true } } } } },
      orderBy: [{ sentOn: 'desc' }, { createdAt: 'desc' }],
    });

    const rows: AnalysisRow[] = entries.map((entry) => ({
      entryId: entry.id,
      projectId: entry.system.projectId,
      projectName: entry.system.project.name,
      clientName: entry.system.project.client.name,
      systemLabel: entry.system.label,
      systemType: entry.system.type,
      description: entry.description,
      quantity: entry.quantity.toFixed(3),
      unit: entry.unit,
      sentOn: utcDateToIsoDate(entry.sentOn),
      amount: entry.amount ? entry.amount.toFixed(2) : null,
    }));

    const summary = summariseAnalysisRows(
      rows.map((row) => ({ projectId: row.projectId, quantity: row.quantity, amount: row.amount })),
    );
    return { summary, rows };
  }

  private dateRange(from?: string, to?: string): Prisma.DateTimeFilter | undefined {
    if (!from && !to) return undefined;
    return {
      ...(from ? { gte: isoDateToUtcDate(from) } : {}),
      ...(to ? { lte: isoDateToUtcDate(to) } : {}),
    };
  }
}
