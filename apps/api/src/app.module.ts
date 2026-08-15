import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppConfigModule } from './config/config.module';
import { LoggingModule } from './logging/logging.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './common/audit/audit.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { RolesGuard } from './common/guards/roles.guard';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './auth/guards/auth.guard';
import { UsersModule } from './users/users.module';
import { ClientsModule } from './clients/clients.module';
import { ProjectsModule } from './projects/projects.module';
import { SystemsModule } from './systems/systems.module';
import { ItemsModule } from './items/items.module';
import { EntriesModule } from './entries/entries.module';
import { EmployeesModule } from './employees/employees.module';
import { VisitsModule } from './visits/visits.module';
import { ExpensesModule } from './expenses/expenses.module';
import { PaymentsModule } from './payments/payments.module';
import { AnalysisModule } from './analysis/analysis.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    AppConfigModule,
    LoggingModule,
    PrismaModule,
    AuditModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    AuthModule,
    UsersModule,
    ClientsModule,
    ProjectsModule,
    SystemsModule,
    ItemsModule,
    EntriesModule,
    EmployeesModule,
    VisitsModule,
    ExpensesModule,
    PaymentsModule,
    AnalysisModule,
    HealthModule,
  ],
  providers: [
    // Order matters: rate-limit first, then authenticate, then authorize.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
