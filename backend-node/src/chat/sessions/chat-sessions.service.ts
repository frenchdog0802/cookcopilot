import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { ChatSession } from '@prisma/client';
import { NotFoundError } from '../../common/errors/http-errors';
import { nowUnixSeconds } from '../../common/time';
import { PrismaService } from '../../prisma/prisma.service';
import { STREAM_TIMEOUT_MS } from '../chat-limits';
import { CookingAgentGraphService } from '../graph/cooking-agent-graph.service';

export type ChatSessionDto = {
  id: string;
  title: string;
  isDefault: boolean;
  updatedAt: number | null;
  createdAt: number | null;
};

@Injectable()
export class ChatSessionsService implements OnModuleInit {
  private readonly logger = new Logger(ChatSessionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cookingAgentGraph: CookingAgentGraphService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.backfillOrphanMessages();
    } catch (error) {
      this.logger.warn(
        'Chat session backfill skipped (schema may not be applied yet)',
        error instanceof Error ? error.message : error,
      );
    }
  }

  toDto(session: ChatSession): ChatSessionDto {
    return {
      id: session.id,
      title: session.title,
      isDefault: session.isDefault,
      updatedAt: session.updatedAt != null ? Number(session.updatedAt) : null,
      createdAt: session.createdAt != null ? Number(session.createdAt) : null,
    };
  }

  async listSessions(userId: string): Promise<ChatSession[]> {
    await this.ensureDefaultSession(userId);
    return this.prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createSession(userId: string, title?: string): Promise<ChatSession> {
    const now = BigInt(nowUnixSeconds());
    return this.prisma.chatSession.create({
      data: {
        userId,
        title: title?.trim() || 'New chat',
        isDefault: false,
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  async renameSession(
    userId: string,
    sessionId: string,
    title: string,
  ): Promise<ChatSession> {
    const session = await this.requireOwnedSession(userId, sessionId);
    return this.prisma.chatSession.update({
      where: { id: session.id },
      data: {
        title: title.trim() || session.title,
        updatedAt: BigInt(nowUnixSeconds()),
      },
    });
  }

  async deleteSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.requireOwnedSession(userId, sessionId);
    await this.prisma.chatSession.delete({ where: { id: session.id } });
    try {
      await this.cookingAgentGraph.deleteThread(session.id);
    } catch (error) {
      this.logger.warn(
        `Failed to delete checkpointer thread ${session.id}`,
        error,
      );
    }
    const remaining = await this.prisma.chatSession.count({
      where: { userId },
    });
    if (remaining === 0) {
      await this.ensureDefaultSession(userId);
    }
  }

  async resolveSessionId(
    userId: string,
    sessionId?: string,
  ): Promise<ChatSession> {
    if (sessionId) {
      return this.requireOwnedSession(userId, sessionId);
    }
    return this.ensureDefaultSession(userId);
  }

  async ensureDefaultSession(userId: string): Promise<ChatSession> {
    const existing = await this.prisma.chatSession.findFirst({
      where: { userId, isDefault: true },
    });
    if (existing) {
      return existing;
    }

    const anySession = await this.prisma.chatSession.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    if (anySession) {
      return this.prisma.chatSession.update({
        where: { id: anySession.id },
        data: { isDefault: true },
      });
    }

    const now = BigInt(nowUnixSeconds());
    return this.prisma.chatSession.create({
      data: {
        userId,
        title: 'Chat',
        isDefault: true,
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  async touchSession(sessionId: string): Promise<void> {
    await this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: BigInt(nowUnixSeconds()) },
    });
  }

  async tryAcquireDbLock(sessionId: string): Promise<boolean> {
    const now = nowUnixSeconds();
    const staleBefore = BigInt(now - Math.floor(STREAM_TIMEOUT_MS / 1000));

    const result = await this.prisma.chatSession.updateMany({
      where: {
        id: sessionId,
        OR: [{ lockedAt: null }, { lockedAt: { lt: staleBefore } }],
      },
      data: { lockedAt: BigInt(now) },
    });
    return result.count === 1;
  }

  async releaseDbLock(sessionId: string): Promise<void> {
    await this.prisma.chatSession.updateMany({
      where: { id: sessionId },
      data: { lockedAt: null },
    });
  }

  async backfillOrphanMessages(): Promise<void> {
    const orphans = await this.prisma.aIMessage.findMany({
      where: { sessionId: null },
      select: { userId: true },
      distinct: ['userId'],
    });

    for (const { userId } of orphans) {
      const session = await this.ensureDefaultSession(userId);
      await this.prisma.aIMessage.updateMany({
        where: { userId, sessionId: null },
        data: { sessionId: session.id },
      });
    }
  }

  private async requireOwnedSession(
    userId: string,
    sessionId: string,
  ): Promise<ChatSession> {
    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) {
      throw new NotFoundError('Chat session not found');
    }
    return session;
  }
}
