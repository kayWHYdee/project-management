import { Injectable } from '@nestjs/common';
import { type Payment as PrismaPayment } from '@prisma/client';
import {
  isoDateToUtcDate,
  utcDateToIsoDate,
  type CreatePaymentRequest,
  type Payment,
} from '@water-pm/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { NotFoundError } from '../common/errors/domain-error';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listForProject(projectId: string): Promise<Payment[]> {
    const payments = await this.prisma.payment.findMany({
      where: { projectId, deletedAt: null },
      orderBy: [{ receivedOn: 'desc' }, { createdAt: 'desc' }],
    });
    return payments.map((payment) => this.toPayment(payment));
  }

  async create(
    projectId: string,
    dto: CreatePaymentRequest,
    actor: AuthenticatedUser,
  ): Promise<Payment> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
    });
    if (!project) {
      throw new NotFoundError('Project not found');
    }
    const created = await this.prisma.payment.create({
      data: {
        projectId,
        amount: dto.amount,
        receivedOn: isoDateToUtcDate(dto.receivedOn),
        note: dto.note ?? null,
        createdById: actor.id,
      },
    });
    await this.audit.record({
      userId: actor.id,
      entity: 'Payment',
      entityId: created.id,
      action: 'CREATE',
      after: created,
    });
    return this.toPayment(created);
  }

  async remove(id: string, actor: AuthenticatedUser): Promise<void> {
    const payment = await this.prisma.payment.findFirst({ where: { id, deletedAt: null } });
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }
    await this.prisma.payment.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.record({
      userId: actor.id,
      entity: 'Payment',
      entityId: id,
      action: 'DELETE',
      before: payment,
    });
  }

  private toPayment(payment: PrismaPayment): Payment {
    return {
      id: payment.id,
      projectId: payment.projectId,
      amount: payment.amount.toFixed(2),
      receivedOn: utcDateToIsoDate(payment.receivedOn),
      note: payment.note,
      createdAt: payment.createdAt.toISOString(),
    };
  }
}
