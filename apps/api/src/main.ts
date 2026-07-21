import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();

  const config = app.get(AppConfigService);
  await app.listen(config.port, '0.0.0.0');

  app.get(Logger).log(`API listening on port ${config.port}`, 'Bootstrap');
}

void bootstrap();
