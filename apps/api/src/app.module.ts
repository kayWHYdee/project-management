import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { LoggingModule } from './logging/logging.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [AppConfigModule, LoggingModule, PrismaModule, HealthModule],
})
export class AppModule {}
