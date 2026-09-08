import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MemorySaver } from '@langchain/langgraph';
import type { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import { Pool } from 'pg';
import type { AppConfig } from '../../config/env.schema';
import { buildDatabaseUrl } from '../../prisma/database-url';
import { CHAT_CHECKPOINTER } from './chat-checkpointer.token';

const logger = new Logger('ChatCheckpointer');

export const chatCheckpointerProvider = {
  provide: CHAT_CHECKPOINTER,
  inject: [ConfigService],
  useFactory: async (
    configService: ConfigService,
  ): Promise<BaseCheckpointSaver> => {
    const app = configService.get<AppConfig>('app')!;
    if (app.optional.chatUseMemoryCheckpointer) {
      logger.log('Using MemorySaver checkpointer');
      return new MemorySaver();
    }

    const connString = buildDatabaseUrl(app.database);
    // Supabase / managed Postgres often present a chain that node-pg treats as
    // self-signed when sslmode=require is aliased to verify-full.
    const sslEnabled = app.database.sslMode.toLowerCase() !== 'disable';
    const pool = new Pool({
      connectionString: connString,
      ...(sslEnabled ? { ssl: { rejectUnauthorized: false } } : {}),
    });

    const saver = new PostgresSaver(pool);
    await saver.setup();
    logger.log('PostgresSaver checkpointer ready');
    return saver;
  },
};
