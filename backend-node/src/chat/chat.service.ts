import { Injectable, Logger } from '@nestjs/common';
import { GraphRecursionError } from '@langchain/langgraph';
import {
  GENERIC_ERROR_MESSAGE,
  TOOL_JSON_ERROR_MESSAGE,
  TOOL_STATE_ERROR_MESSAGE,
} from './chat.constants';
import type { ChatSendResponseDto } from './dto/chat.dto';
import {
  CookingAgentGraphService,
  type GraphStreamCallbacks,
} from './graph/cooking-agent-graph.service';
import type { HitlResumeDecision } from './graph/cooking-agent.state';
import { ToolResultCollectorService } from './tool-result-collector.service';

export type StreamCallbacks = GraphStreamCallbacks;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly cookingAgentGraph: CookingAgentGraphService,
    private readonly toolResultCollector: ToolResultCollectorService,
  ) {}

  enrichMessage(
    userMessage: string,
    recipeContext?: { recipeId?: string; recipeName?: string },
  ): string {
    const lines = [`[Today's date: ${new Date().toISOString().slice(0, 10)}]`];
    if (recipeContext?.recipeId || recipeContext?.recipeName) {
      lines.push(
        `[Context: User is viewing recipe with ID: ${recipeContext.recipeId ?? ''}, name: "${recipeContext.recipeName ?? ''}"]`,
      );
    }
    return `${lines.join('\n')}\n\n${userMessage}`;
  }

  mapToolResult(userId: string, aiText: string): ChatSendResponseDto {
    const responseType = this.toolResultCollector.primaryResponseType(userId);
    const data = this.toolResultCollector.toAggregatedData(userId);

    if (responseType === 'multi_action') {
      return {
        type: responseType,
        message: aiText,
        data: {
          actions: data.actions,
          actionCount: data.actionCount,
        },
      };
    }

    return {
      type: responseType,
      message: aiText,
      data,
    };
  }

  interruptResponse(
    sessionId: string,
    pendingTools: Array<{ name: string; argsSummary: string; id?: string }>,
  ): ChatSendResponseDto {
    return {
      type: 'interrupt',
      message: 'Approval required before applying changes.',
      data: {
        sessionId,
        pendingTools,
      },
    };
  }

  async send(
    userId: string,
    sessionId: string,
    userMessage: string,
    recipeContext?: { recipeId?: string; recipeName?: string },
  ): Promise<ChatSendResponseDto> {
    const enriched = this.enrichMessage(userMessage, recipeContext);
    const result = await this.cookingAgentGraph.runTurn({
      userId,
      sessionId,
      enrichedMessage: enriched,
      recipeContext,
      callbacks: {
        onToken: () => undefined,
        onToolStatus: () => undefined,
      },
    });

    if (result.interrupted) {
      return this.interruptResponse(sessionId, result.pendingTools);
    }

    return this.toCompletedResponse(userId, result.finalText);
  }

  async stream(
    userId: string,
    sessionId: string,
    userMessage: string,
    recipeContext: { recipeId?: string; recipeName?: string } | undefined,
    callbacks: StreamCallbacks,
  ): Promise<ChatSendResponseDto> {
    const enriched = this.enrichMessage(userMessage, recipeContext);
    const result = await this.cookingAgentGraph.runTurn({
      userId,
      sessionId,
      enrichedMessage: enriched,
      recipeContext,
      callbacks,
    });

    if (result.interrupted) {
      return this.interruptResponse(sessionId, result.pendingTools);
    }

    return this.toCompletedResponse(userId, result.finalText);
  }

  async resume(
    userId: string,
    sessionId: string,
    decision: HitlResumeDecision,
    callbacks?: StreamCallbacks,
  ): Promise<ChatSendResponseDto> {
    const result = await this.cookingAgentGraph.resumeTurn({
      userId,
      sessionId,
      decision,
      callbacks: callbacks ?? {
        onToken: () => undefined,
        onToolStatus: () => undefined,
      },
    });

    if (result.interrupted) {
      return this.interruptResponse(sessionId, result.pendingTools);
    }

    return this.toCompletedResponse(userId, result.finalText);
  }

  userFacingError(error: unknown): string {
    if (error instanceof GraphRecursionError) {
      return 'That request took too many steps. Please try a smaller request.';
    }

    let current: unknown = error;
    while (current) {
      const name =
        current instanceof Error ? current.constructor.name : typeof current;
      const message =
        current instanceof Error
          ? current.message
          : typeof current === 'string'
            ? current
            : '';

      if (
        name.includes('SyntaxError') ||
        message.includes('Unexpected end-of-input') ||
        message.includes('argumentsAsMap') ||
        message.includes('JSON')
      ) {
        return TOOL_JSON_ERROR_MESSAGE;
      }

      if (
        message.includes("role 'tool'") ||
        message.includes('tool_calls') ||
        name.includes('InvalidRequest')
      ) {
        return TOOL_STATE_ERROR_MESSAGE;
      }

      current =
        current instanceof Error && 'cause' in current
          ? current.cause
          : undefined;
    }

    this.logger.debug(`Unhandled chat error: ${String(error)}`);
    return GENERIC_ERROR_MESSAGE;
  }

  private toCompletedResponse(
    userId: string,
    aiText: string,
  ): ChatSendResponseDto {
    if (this.toolResultCollector.hasResult(userId)) {
      return this.mapToolResult(userId, aiText);
    }
    return {
      type: 'text',
      message: aiText,
      data: {},
    };
  }
}
