import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MemorySaver } from '@langchain/langgraph';
import type { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
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
    const saver = PostgresSaver.fromConnString(connString);
    await saver.setup();
    logger.log('PostgresSaver checkpointer ready');
    return saver;
  },
};
