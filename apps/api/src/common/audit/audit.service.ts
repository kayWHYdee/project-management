import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type AuditAction =
  'CREATE' | 'UPDATE' | 'DELETE' | 'MERGE' | 'LOGIN' | 'LOGOUT' | 'PASSWORD_CHANGE';

export interface AuditRecord {
  userId?: string | null;
  entity: string;
  entityId: string;
  action: AuditAction;
  before?: unknown;
  after?: unknown;
  /** Pass a transaction client to write the audit row in the same transaction. */
  tx?: Prisma.TransactionClient;
}

/**
 * Writes an append-only audit row for a mutation. Every mutating service call
 * should record one so we can answer "who changed this, and what did it look
 * like before/after".
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(record: AuditRecord): Promise<void> {
    const client = record.tx ?? this.prisma;
    await client.auditLog.create({
      data: {
        userId: record.userId ?? null,
        entity: record.entity,
        entityId: record.entityId,
        action: record.action,
        before: this.toJson(record.before),
        after: this.toJson(record.after),
      },
    });
  }

  private toJson(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
    if (value === undefined || value === null) {
      return Prisma.JsonNull;
    }
    // Round-trip to strip class instances / Decimals into plain JSON.
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}
