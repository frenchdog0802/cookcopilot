import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { DEFAULT_PORT } from './config/env.constants';
import type { AppConfig } from './config/env.schema';
import { configureApp } from './configure-app';

async function bootstrap(): Promise<void> {
  // rawBody: true keeps the original Buffer for Stripe webhook signature verify.
  const app = await NestFactory.create(AppModule, { rawBody: true });

  const config = app.get(ConfigService);
  const appConfig = config.get<AppConfig>('app');
  if (appConfig) {
    configureApp(app, appConfig);
  }

  const port = appConfig?.port ?? DEFAULT_PORT;
  await app.listen(port);
}

void bootstrap();
