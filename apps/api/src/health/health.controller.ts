import { Controller, Get } from '@nestjs/common';
import type { HealthResponse } from '@water-pm/shared';
import { Public } from '../common/decorators/public.decorator';
import { HealthService } from './health.service';

@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  check(): Promise<HealthResponse> {
    return this.health.check();
  }
}
