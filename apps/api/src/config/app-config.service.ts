import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from './env.schema';

/**
 * Thin typed wrapper over Nest's ConfigService so the rest of the app never
 * touches raw `process.env` and every value is strongly typed.
 */
@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  get nodeEnv(): Env['NODE_ENV'] {
    return this.config.get('NODE_ENV', { infer: true });
  }

  get port(): number {
    return this.config.get('API_PORT', { infer: true });
  }

  get databaseUrl(): string {
    return this.config.get('DATABASE_URL', { infer: true });
  }

  get sessionSecret(): string {
    return this.config.get('SESSION_SECRET', { infer: true });
  }

  get cookieSecure(): boolean {
    return this.config.get('COOKIE_SECURE', { infer: true });
  }

  get logDir(): string {
    return this.config.get('LOG_DIR', { infer: true });
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }
}
