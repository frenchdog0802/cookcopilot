import { Injectable } from '@nestjs/common';
import type { AIMessage, Prisma } from '@prisma/client';
import { bigintToNumber } from '../common/mappers/user.mapper';
import { nowUnixSeconds } from '../common/time';
import { PrismaService } from '../prisma/prisma.service';
import { UI_HISTORY_MESSAGE_LIMIT } from './chat-limits';
import type { ChatHistoryMessageDto } from './dto/chat.dto';

@Injectable()
export class ChatHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async loadHistoryForUi(
    userId: string,
    sessionId: string,
  ): Promise<AIMessage[]> {
    return this.loadRowsDescending(userId, sessionId, UI_HISTORY_MESSAGE_LIMIT);
  }

  async saveUserMessage(
    userId: string,
    sessionId: string,
    content: string,
  ): Promise<void> {
    await this.prisma.aIMessage.create({
      data: {
        userId,
        sessionId,
        role: 'user',
        content,
        tokenIn: 0,
        tokenOut: 0,
        createdAt: BigInt(nowUnixSeconds()),
      },
    });
  }

  async saveAssistantMessage(
    userId: string,
    sessionId: string,
    content: string,
    options?: {
      tokenIn?: number;
      tokenOut?: number;
      responseType?: string;
      cardData?: Record<string, unknown>;
    },
  ): Promise<void> {
    await this.prisma.aIMessage.create({
      data: {
        userId,
        sessionId,
        role: 'assistant',
        content,
        responseType: options?.responseType,
        cardData: (options?.cardData ?? undefined) as
          Prisma.InputJsonValue | undefined,
        tokenIn: options?.tokenIn ?? 0,
        tokenOut: options?.tokenOut ?? 0,
        createdAt: BigInt(nowUnixSeconds()),
      },
    });
  }

  async clearHistory(userId: string, sessionId: string): Promise<void> {
    await this.prisma.aIMessage.deleteMany({
      where: { userId, sessionId },
    });
  }

  toHistoryDto(message: AIMessage): ChatHistoryMessageDto {
    return {
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: bigintToNumber(message.createdAt),
      responseType: message.responseType ?? undefined,
      cardData:
        message.cardData && typeof message.cardData === 'object'
          ? (message.cardData as Record<string, unknown>)
          : undefined,
    };
  }

  private async loadRowsDescending(
    userId: string,
    sessionId: string,
    limit: number,
  ): Promise<AIMessage[]> {
    const descending = await this.prisma.aIMessage.findMany({
      where: { userId, sessionId },
      orderBy: { createdAt: 'desc' },
      take: Math.max(limit, 50),
    });

    if (descending.length === 0) {
      return [];
    }

    const ascending = [...descending].reverse();
    if (ascending.length > limit) {
      return ascending.slice(ascending.length - limit);
    }
    return ascending;
  }
}
