import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ok } from '../common/api-response';
import { QuotaExceededError } from '../common/errors/http-errors';
import {
  AVAILABLE_TOOLS,
  BUSY_ERROR_MESSAGE,
  FORBIDDEN_PATTERNS,
  GUARD_MESSAGE,
} from './chat.constants';
import { ChatHistoryService } from './chat-history.service';
import { STREAM_TIMEOUT_MS } from './chat-limits';
import { ChatSessionGuard } from './chat-session.guard';
import { ChatService } from './chat.service';
import {
  ChatResumeRequestDto,
  ChatSendRequestDto,
  CreateChatSessionDto,
  RenameChatSessionDto,
  type ChatSendResponseDto,
} from './dto/chat.dto';
import { CookingAgentGraphService } from './graph/cooking-agent-graph.service';
import { ChatSessionsService } from './sessions/chat-sessions.service';
import { ToolResultCollectorService } from './tool-result-collector.service';
import { UsageQuotaService } from '../usage-quota/usage-quota.service';

@Controller('api/chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly chatHistoryService: ChatHistoryService,
    private readonly chatSessionsService: ChatSessionsService,
    private readonly chatSessionGuard: ChatSessionGuard,
    private readonly toolResultCollector: ToolResultCollectorService,
    private readonly usageQuotaService: UsageQuotaService,
    private readonly cookingAgentGraph: CookingAgentGraphService,
  ) {}

  @Get('sessions')
  async listSessions(@CurrentUser() userId: string) {
    const sessions = await this.chatSessionsService.listSessions(userId);
    return ok({
      sessions: sessions.map((session) =>
        this.chatSessionsService.toDto(session),
      ),
    });
  }

  @Post('sessions')
  async createSession(
    @CurrentUser() userId: string,
    @Body() body: CreateChatSessionDto,
  ) {
    const session = await this.chatSessionsService.createSession(
      userId,
      body.title,
    );
    return ok(this.chatSessionsService.toDto(session));
  }

  @Patch('sessions/:id')
  async renameSession(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: RenameChatSessionDto,
  ) {
    const session = await this.chatSessionsService.renameSession(
      userId,
      id,
      body.title,
    );
    return ok(this.chatSessionsService.toDto(session));
  }

  @Delete('sessions/:id')
  async deleteSession(@CurrentUser() userId: string, @Param('id') id: string) {
    await this.chatSessionsService.deleteSession(userId, id);
    return ok({ deleted: true });
  }

  @Post('send')
  async send(
    @CurrentUser() userId: string,
    @Body() request: ChatSendRequestDto,
  ) {
    const session = await this.chatSessionsService.resolveSessionId(
      userId,
      request.sessionId,
    );
    const sessionId = session.id;
    const userMessage = request.message;

    const guardResponse = this.checkGuards(userMessage);
    if (guardResponse) {
      return ok(guardResponse);
    }

    if (!(await this.acquireLocks(userId, sessionId))) {
      return ok(this.errorResponse(BUSY_ERROR_MESSAGE));
    }

    try {
      await this.usageQuotaService.checkAndIncrementAiMessage(userId);
    } catch (error) {
      await this.releaseLocks(userId, sessionId);
      if (error instanceof QuotaExceededError) {
        return ok(this.quotaErrorResponse(error));
      }
      throw error;
    }

    this.toolResultCollector.begin(userId);

    try {
      const result = await this.chatService.send(
        userId,
        sessionId,
        userMessage,
        request.recipeContext,
      );

      await this.chatHistoryService.saveUserMessage(
        userId,
        sessionId,
        userMessage,
      );

      if (result.type !== 'interrupt' && result.message.trim().length > 0) {
        await this.persistAssistant(userId, sessionId, result);
      }

      await this.chatSessionsService.touchSession(sessionId);

      if (result.type === 'interrupt') {
        // Keep locks while waiting for resume
        return ok(result);
      }

      return ok(result);
    } catch (error) {
      this.logger.error(`Chat request failed for user ${userId}`, error);
      await this.chatHistoryService.saveUserMessage(
        userId,
        sessionId,
        userMessage,
      );
      return ok(this.errorResponse(this.chatService.userFacingError(error)));
    } finally {
      this.toolResultCollector.end(userId);
      // Release unless interrupt (client will resume)
      // For sync send interrupt we still release memory lock? Design: hold lock.
      // Holding forever is bad for sync clients that never resume — release after send
      // for sync path always; stream holds. Plan said hold until resume for stream.
      // For send: release always (interrupt state lives in checkpointer).
      await this.releaseLocks(userId, sessionId);
    }
  }

  @Post('stream')
  async stream(
    @CurrentUser() userId: string,
    @Body() request: ChatSendRequestDto,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    let streamClosed = false;
    let holdLockForInterrupt = false;
    let sessionId = '';

    const closeStream = () => {
      streamClosed = true;
    };

    const sendEvent = (event: string, data: string): boolean => {
      if (streamClosed) {
        return false;
      }
      try {
        res.write(`event: ${event}\ndata: ${data}\n\n`);
        return true;
      } catch {
        closeStream();
        return false;
      }
    };

    const sendDone = (payload: ChatSendResponseDto) => {
      if (streamClosed) {
        return;
      }
      closeStream();
      try {
        res.write(`event: done\ndata: ${JSON.stringify(payload)}\n\n`);
        res.end();
      } catch {
        try {
          res.end();
        } catch {
          // already closed
        }
      }
    };

    const sendError = (message: string) => {
      if (streamClosed) {
        return;
      }
      closeStream();
      try {
        res.write(`event: error\ndata: ${JSON.stringify({ message })}\n\n`);
        res.end();
      } catch {
        try {
          res.end();
        } catch {
          // already closed
        }
      }
    };

    const timeout = setTimeout(() => {
      if (streamClosed) {
        return;
      }
      void this.cleanupTurn(userId, sessionId);
      sendError('Request timed out. Please try again with a smaller request.');
    }, STREAM_TIMEOUT_MS);

    const session = await this.chatSessionsService.resolveSessionId(
      userId,
      request.sessionId,
    );
    sessionId = session.id;
    const userMessage = request.message;

    const guardResponse = this.checkGuards(userMessage);
    if (guardResponse) {
      clearTimeout(timeout);
      sendDone(guardResponse);
      return;
    }

    if (!(await this.acquireLocks(userId, sessionId))) {
      clearTimeout(timeout);
      sendDone(this.errorResponse(BUSY_ERROR_MESSAGE));
      return;
    }

    try {
      await this.usageQuotaService.checkAndIncrementAiMessage(userId);
    } catch (error) {
      await this.releaseLocks(userId, sessionId);
      clearTimeout(timeout);
      if (error instanceof QuotaExceededError) {
        sendDone(this.quotaErrorResponse(error));
        return;
      }
      throw error;
    }

    this.toolResultCollector.begin(userId);
    await this.chatHistoryService.saveUserMessage(
      userId,
      sessionId,
      userMessage,
    );

    try {
      const result = await this.chatService.stream(
        userId,
        sessionId,
        userMessage,
        request.recipeContext,
        {
          onToken: (token) => {
            sendEvent('token', token);
          },
          onToolStatus: (tool, message) => {
            sendEvent('status', JSON.stringify({ tool, message }));
          },
        },
      );

      await this.chatSessionsService.touchSession(sessionId);

      if (result.type === 'interrupt') {
        holdLockForInterrupt = true;
        clearTimeout(timeout);
        this.toolResultCollector.end(userId);
        // Keep locks for resume; end SSE with interrupt event + done payload
        sendEvent('interrupt', JSON.stringify(result));
        sendDone(result);
        return;
      }

      if (result.message.trim().length > 0) {
        await this.persistAssistant(userId, sessionId, result);
      }

      clearTimeout(timeout);
      this.toolResultCollector.end(userId);
      await this.releaseLocks(userId, sessionId);
      sendDone(result);
    } catch (error) {
      clearTimeout(timeout);
      this.logger.error(`Chat stream failed for user ${userId}`, error);
      this.toolResultCollector.end(userId);
      await this.releaseLocks(userId, sessionId);
      sendError(this.chatService.userFacingError(error));
    }

    res.on('close', () => {
      clearTimeout(timeout);
      if (!streamClosed || holdLockForInterrupt) {
        // If interrupted, keep DB lock briefly but release memory permit so resume can acquire
        if (holdLockForInterrupt) {
          this.chatSessionGuard.release(userId, sessionId);
          closeStream();
          return;
        }
        void this.cleanupTurn(userId, sessionId);
        closeStream();
      }
    });
  }

  @Post('resume')
  async resume(
    @CurrentUser() userId: string,
    @Body() request: ChatResumeRequestDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.chatSessionsService.resolveSessionId(
      userId,
      request.sessionId,
    );
    const sessionId = session.id;

    if (!(await this.acquireLocks(userId, sessionId))) {
      return ok(this.errorResponse(BUSY_ERROR_MESSAGE));
    }

    // No quota increment on resume
    this.toolResultCollector.begin(userId);

    const wantsStream = (res.req.headers.accept ?? '').includes(
      'text/event-stream',
    );

    if (wantsStream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      let closed = false;
      const sendEvent = (event: string, data: string) => {
        if (closed) return;
        try {
          res.write(`event: ${event}\ndata: ${data}\n\n`);
        } catch {
          closed = true;
        }
      };

      try {
        const result = await this.chatService.resume(
          userId,
          sessionId,
          { decision: request.decision, note: request.note },
          {
            onToken: (token) => sendEvent('token', token),
            onToolStatus: (tool, message) =>
              sendEvent('status', JSON.stringify({ tool, message })),
          },
        );

        if (result.type !== 'interrupt' && result.message.trim().length > 0) {
          await this.persistAssistant(userId, sessionId, result);
        }
        await this.chatSessionsService.touchSession(sessionId);

        if (result.type === 'interrupt') {
          sendEvent('interrupt', JSON.stringify(result));
        }
        sendEvent('done', JSON.stringify(result));
        res.end();
        return;
      } catch (error) {
        this.logger.error(`Chat resume stream failed for ${userId}`, error);
        sendEvent(
          'error',
          JSON.stringify({
            message: this.chatService.userFacingError(error),
          }),
        );
        res.end();
        return;
      } finally {
        this.toolResultCollector.end(userId);
        await this.releaseLocks(userId, sessionId);
      }
    }

    try {
      const result = await this.chatService.resume(userId, sessionId, {
        decision: request.decision,
        note: request.note,
      });

      if (result.type !== 'interrupt' && result.message.trim().length > 0) {
        await this.persistAssistant(userId, sessionId, result);
      }
      await this.chatSessionsService.touchSession(sessionId);
      return ok(result);
    } catch (error) {
      this.logger.error(`Chat resume failed for user ${userId}`, error);
      return ok(this.errorResponse(this.chatService.userFacingError(error)));
    } finally {
      this.toolResultCollector.end(userId);
      await this.releaseLocks(userId, sessionId);
    }
  }

  @Get('history')
  async history(
    @CurrentUser() userId: string,
    @Query('sessionId') sessionId?: string,
  ) {
    const session = await this.chatSessionsService.resolveSessionId(
      userId,
      sessionId,
    );
    const messages = await this.chatHistoryService.loadHistoryForUi(
      userId,
      session.id,
    );
    return ok({
      sessionId: session.id,
      messages: messages.map((message) =>
        this.chatHistoryService.toHistoryDto(message),
      ),
    });
  }

  @Delete('history')
  async clearHistory(
    @CurrentUser() userId: string,
    @Query('sessionId') sessionId?: string,
  ) {
    const session = await this.chatSessionsService.resolveSessionId(
      userId,
      sessionId,
    );
    await this.chatHistoryService.clearHistory(userId, session.id);
    try {
      await this.cookingAgentGraph.deleteThread(session.id);
    } catch {
      // best effort
    }
    return ok({ cleared: true, sessionId: session.id });
  }

  @Get('actions')
  listActions() {
    return ok({
      actions: [...AVAILABLE_TOOLS],
      description: 'Available tools that can be triggered via chat',
    });
  }

  private async persistAssistant(
    userId: string,
    sessionId: string,
    result: ChatSendResponseDto,
  ): Promise<void> {
    await this.chatHistoryService.saveAssistantMessage(
      userId,
      sessionId,
      result.message,
      {
        responseType: result.type,
        cardData: result.data,
      },
    );
  }

  private async acquireLocks(
    userId: string,
    sessionId: string,
  ): Promise<boolean> {
    if (!this.chatSessionGuard.tryAcquire(userId, sessionId)) {
      return false;
    }
    const dbOk = await this.chatSessionsService.tryAcquireDbLock(sessionId);
    if (!dbOk) {
      this.chatSessionGuard.release(userId, sessionId);
      return false;
    }
    return true;
  }

  private async releaseLocks(userId: string, sessionId: string): Promise<void> {
    this.chatSessionGuard.release(userId, sessionId);
    await this.chatSessionsService.releaseDbLock(sessionId);
  }

  private async cleanupTurn(userId: string, sessionId: string): Promise<void> {
    this.toolResultCollector.end(userId);
    if (sessionId) {
      await this.releaseLocks(userId, sessionId);
    }
  }

  private checkGuards(userMessage: string): ChatSendResponseDto | null {
    const lower = userMessage.toLowerCase();
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (lower.includes(pattern)) {
        return this.errorResponse(GUARD_MESSAGE);
      }
    }
    return null;
  }

  private errorResponse(message: string): ChatSendResponseDto {
    return {
      type: 'error',
      message,
      data: {},
    };
  }

  private quotaErrorResponse(error: QuotaExceededError): ChatSendResponseDto {
    return {
      type: 'error',
      message: error.message,
      data: { quotaKey: error.quotaKey },
    };
  }
}
