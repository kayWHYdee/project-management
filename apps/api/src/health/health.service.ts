import { Injectable } from '@nestjs/common';
import { type HealthResponse, healthResponseSchema } from '@water-pm/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthResponse> {
    // Round-trips the database so a green health check also proves connectivity.
    await this.prisma.$queryRaw`SELECT 1`;
    return healthResponseSchema.parse({
      status: 'ok',
      service: 'water-pm-api',
      time: new Date().toISOString(),
    });
  }
}
