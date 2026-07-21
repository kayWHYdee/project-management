import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import pino from 'pino';
import { AppConfigModule } from '../config/config.module';
import { AppConfigService } from '../config/app-config.service';

/**
 * Structured JSON logging via pino. In production, logs are written both to
 * stdout (for `docker logs`) and to a JSON file on a mounted volume. In
 * development, output is pretty-printed to the console.
 */
@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => {
        const redact = ['req.headers.cookie', 'req.headers.authorization'];

        if (!config.isProduction) {
          return {
            pinoHttp: {
              level: 'debug',
              redact,
              transport: {
                target: 'pino-pretty',
                options: { singleLine: true, translateTime: 'SYS:standard' },
              },
            },
          };
        }

        mkdirSync(config.logDir, { recursive: true });
        const stream = pino.multistream([
          { stream: process.stdout },
          { stream: pino.destination({ dest: join(config.logDir, 'api.log'), mkdir: true }) },
        ]);

        return {
          pinoHttp: [{ level: 'info', redact }, stream],
        };
      },
    }),
  ],
})
export class LoggingModule {}
