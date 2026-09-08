import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import type { AppConfig } from '../config/env.schema';
import { buildDatabaseUrl } from './database-url';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private databaseAvailable = false;

  constructor(configService: ConfigService) {
    const appConfig = configService.get<AppConfig>('app');
    if (appConfig) {
      process.env.DATABASE_URL = buildDatabaseUrl(appConfig.database);
    }
    super();
  }

  isDatabaseAvailable(): boolean {
    return this.databaseAvailable;
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.databaseAvailable = true;
    } catch (error) {
      this.databaseAvailable = false;
      const nodeEnv = process.env.NODE_ENV ?? 'development';
      // Allow boot without Postgres in test/dev so health + static routes work.
      // Production still fails fast (same expectation as Spring without DB).
      if (nodeEnv === 'production') {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Database unavailable — continuing without Prisma connection (${message})`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.databaseAvailable) {
      await this.$disconnect();
    }
  }
}
