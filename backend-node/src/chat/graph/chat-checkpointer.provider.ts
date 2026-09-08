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

/**
 * node-pg v8+ treats sslmode=require as verify-full, which fails on Supabase's
 * chain. Strip sslmode from the URL and pass explicit ssl so we can connect.
 */
function buildCheckpointerPool(app: AppConfig): Pool {
  const rawUrl = buildDatabaseUrl(app.database);
  const url = new URL(rawUrl);
  url.searchParams.delete('sslmode');
  // Keep pooler hint; drop sslmode so Pool.ssl controls TLS.
  const connectionString = url.toString();
  const sslEnabled = app.database.sslMode.toLowerCase() !== 'disable';

  return new Pool({
    connectionString,
    ...(sslEnabled
      ? {
          ssl: {
            rejectUnauthorized: false,
          },
        }
      : {}),
  });
}

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

    const pool = buildCheckpointerPool(app);
    const saver = new PostgresSaver(pool);
    await saver.setup();
    logger.log('PostgresSaver checkpointer ready');
    return saver;
  },
};
