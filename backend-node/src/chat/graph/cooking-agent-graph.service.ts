import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages';
import type { BaseMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import type { StructuredToolInterface } from '@langchain/core/tools';
import {
  Command,
  END,
  interrupt,
  isInterrupted,
  MemorySaver,
  START,
  StateGraph,
} from '@langchain/langgraph';
import type { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint';
import type { AppConfig } from '../../config/env.schema';
import {
  COOKING_ASSISTANT_SYSTEM_PROMPT,
  statusMessageForTool,
} from '../chat.constants';
import { CookingToolsService } from '../cooking-tools.service';
import { CHAT_CHECKPOINTER } from './chat-checkpointer.token';
import {
  CookingAgentState,
  type CookingAgentStateType,
  type HitlResumeDecision,
  type PendingToolSummary,
  type RecipeContextState,
} from './cooking-agent.state';
import {
  requiresHitlApproval,
  summarizeToolArgs,
  isMutatingTool,
} from './hitl.policy';

export type GraphStreamCallbacks = {
  onToken: (token: string) => void;
  onToolStatus: (toolName: string, message: string) => void;
};

export type GraphTurnResult = {
  finalText: string;
  interrupted: boolean;
  pendingTools: PendingToolSummary[];
};

type CompiledCookingGraph = ReturnType<
  CookingAgentGraphService['compileGraph']
>;

@Injectable()
export class CookingAgentGraphService implements OnModuleInit {
  private readonly logger = new Logger(CookingAgentGraphService.name);
  private graph!: CompiledCookingGraph;
  private hitlEnabled = true;
  private recursionLimit = 12;

  constructor(
    private readonly configService: ConfigService,
    private readonly cookingToolsService: CookingToolsService,
    @Inject(CHAT_CHECKPOINTER)
    private readonly checkpointer: BaseCheckpointSaver,
  ) {}

  onModuleInit(): void {
    const app = this.configService.get<AppConfig>('app')!;
    this.hitlEnabled = app.optional.chatHitlEnabled;
    this.recursionLimit = app.optional.chatRecursionLimit;
    this.graph = this.compileGraph();
  }

  /** Test helper to rebuild after env changes. */
  recompileForTests(): void {
    this.onModuleInit();
  }

  async runTurn(params: {
    userId: string;
    sessionId: string;
    enrichedMessage: string;
    recipeContext?: RecipeContextState;
    callbacks: GraphStreamCallbacks;
  }): Promise<GraphTurnResult> {
    const config = this.threadConfig(params.sessionId);
    const input: Partial<CookingAgentStateType> = {
      messages: [new HumanMessage(params.enrichedMessage)],
      userId: params.userId,
      sessionId: params.sessionId,
      recipeContext: params.recipeContext,
      finalText: '',
      pendingApprovals: [],
      hitlDecision: undefined,
    };

    return this.execute(input, config, params.callbacks, params.userId);
  }

  async resumeTurn(params: {
    userId: string;
    sessionId: string;
    decision: HitlResumeDecision;
    callbacks: GraphStreamCallbacks;
  }): Promise<GraphTurnResult> {
    const config = this.threadConfig(params.sessionId);
    const command = new Command({
      resume: params.decision,
      update: {
        userId: params.userId,
        sessionId: params.sessionId,
        hitlDecision: params.decision,
      },
    });

    return this.execute(command, config, params.callbacks, params.userId);
  }

  async deleteThread(sessionId: string): Promise<void> {
    const maybe = this.checkpointer as BaseCheckpointSaver & {
      deleteThread?: (threadId: string) => Promise<void>;
    };
    if (typeof maybe.deleteThread === 'function') {
      await maybe.deleteThread(sessionId);
      return;
    }
    // MemorySaver and some savers may not expose deleteThread.
    this.logger.debug(`No deleteThread on checkpointer for ${sessionId}`);
  }

  private threadConfig(sessionId: string) {
    return {
      configurable: { thread_id: sessionId },
      recursionLimit: this.recursionLimit,
    };
  }

  private async execute(
    input: Partial<CookingAgentStateType> | Command,
    config: {
      configurable: { thread_id: string };
      recursionLimit: number;
    },
    callbacks: GraphStreamCallbacks,
    userId: string,
  ): Promise<GraphTurnResult> {
    // Attach callbacks via closure used inside nodes (per-request tools + status).
    const runLocal = {
      callbacks,
      tools: this.cookingToolsService.buildTools(userId),
      hitlEnabled: this.hitlEnabled,
    };

    // Command resume typing is stricter than Partial state; cast at the boundary.
    const stream = await this.graph.stream(input as never, {
      ...config,
      streamMode: ['messages', 'updates', 'values'] as const,
      // Pass run context for nodes via configurable
      configurable: {
        ...config.configurable,
        __cookingRun: runLocal,
      },
    });

    let finalText = '';
    let pendingTools: PendingToolSummary[] = [];
    let interrupted = false;
    let lastValues: CookingAgentStateType | undefined;

    for await (const chunk of stream) {
      // streamMode tuple yields [mode, data]
      if (!Array.isArray(chunk) || chunk.length < 2) {
        continue;
      }
      const [mode, data] = chunk as [string, unknown];

      if (mode === 'messages') {
        const messageChunk: unknown = Array.isArray(data)
          ? (data as unknown[])[0]
          : data;
        const content =
          messageChunk &&
          typeof messageChunk === 'object' &&
          'content' in messageChunk
            ? (messageChunk as { content?: unknown }).content
            : undefined;
        if (typeof content === 'string' && content.length > 0) {
          // Only forward tokens from AIMessage chunks without tool_call assembly noise when possible
          const msgType =
            messageChunk &&
            typeof messageChunk === 'object' &&
            '_getType' in messageChunk &&
            typeof (messageChunk as { _getType?: () => string })._getType ===
              'function'
              ? (messageChunk as { _getType: () => string })._getType()
              : undefined;
          if (msgType === 'ai' || msgType === undefined) {
            callbacks.onToken(content);
          }
        }
      }

      if (mode === 'values' && data && typeof data === 'object') {
        lastValues = data as CookingAgentStateType;
        if (lastValues.finalText) {
          finalText = lastValues.finalText;
        }
        if (lastValues.pendingApprovals?.length) {
          pendingTools = lastValues.pendingApprovals;
        }
      }

      if (mode === 'updates' && data && typeof data === 'object') {
        const updates = data as Record<string, unknown>;
        if (updates.__interrupt__) {
          interrupted = true;
          const interrupts = updates.__interrupt__ as Array<{
            value?: { pendingTools?: PendingToolSummary[] };
          }>;
          const first = interrupts?.[0]?.value?.pendingTools;
          if (first) {
            pendingTools = first;
          }
        }
      }
    }

    // Fallback: check final state for interrupt
    const state = await this.graph.getState(config);
    if (state.tasks?.some((task) => (task.interrupts?.length ?? 0) > 0)) {
      interrupted = true;
      for (const task of state.tasks) {
        for (const item of task.interrupts ?? []) {
          const value = item.value as
            { pendingTools?: PendingToolSummary[] } | undefined;
          if (value?.pendingTools?.length) {
            pendingTools = value.pendingTools;
          }
        }
      }
    }

    if (!finalText && lastValues?.finalText) {
      finalText = lastValues.finalText;
    }
    if (!finalText && lastValues?.messages?.length) {
      finalText = this.extractLastAiText(lastValues.messages);
    }

    // Detect interrupt via isInterrupted helper on invoke result shape
    if (!interrupted && lastValues && isInterrupted(lastValues)) {
      interrupted = true;
    }

    return { finalText, interrupted, pendingTools };
  }

  private extractLastAiText(messages: BaseMessage[]): string {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const msg = messages[i];
      if (msg._getType() === 'ai') {
        const content = msg.content;
        return typeof content === 'string' ? content : '';
      }
    }
    return '';
  }

  private compileGraph() {
    const builder = new StateGraph(CookingAgentState)
      .addNode('agent', (state, config) => this.agentNode(state, config))
      .addNode('hitl_gate', (state, config) => this.hitlGateNode(state, config))
      .addNode('tools', (state, config) => this.toolsNode(state, config))
      .addNode('finalize', (state) => this.finalizeNode(state))
      .addEdge(START, 'agent')
      .addConditionalEdges('agent', (state) => this.routeAfterAgent(state), {
        hitl_gate: 'hitl_gate',
        finalize: 'finalize',
      })
      .addEdge('hitl_gate', 'tools')
      .addEdge('tools', 'agent')
      .addEdge('finalize', END);

    return builder.compile({
      checkpointer: this.checkpointer ?? new MemorySaver(),
    });
  }

  private async agentNode(
    state: CookingAgentStateType,
    config: { configurable?: Record<string, unknown> },
  ) {
    const run = config.configurable?.__cookingRun as
      | {
          callbacks: GraphStreamCallbacks;
          tools: StructuredToolInterface[];
          hitlEnabled: boolean;
        }
      | undefined;

    const tools =
      run?.tools ?? this.cookingToolsService.buildTools(state.userId);
    const callbacks = run?.callbacks ?? {
      onToken: () => undefined,
      onToolStatus: () => undefined,
    };

    const modelMessages: BaseMessage[] = [
      new SystemMessage(COOKING_ASSISTANT_SYSTEM_PROMPT),
      ...state.messages.filter((m) => m._getType() !== 'system'),
    ];

    const { responseText, toolCalls } = await this.invokeModel(
      modelMessages,
      tools,
      callbacks,
    );

    const aiMessage = new AIMessage({
      content: responseText,
      tool_calls: toolCalls,
    });

    return {
      messages: [aiMessage],
      finalText: toolCalls.length === 0 ? responseText : state.finalText,
      pendingApprovals: [],
    };
  }

  private hitlGateNode(
    state: CookingAgentStateType,
    config: { configurable?: Record<string, unknown> },
  ) {
    const run = config.configurable?.__cookingRun as
      { hitlEnabled: boolean } | undefined;
    const hitlEnabled = run?.hitlEnabled ?? this.hitlEnabled;

    const last = state.messages[state.messages.length - 1];
    const toolCalls =
      last && last._getType() === 'ai'
        ? ((last as AIMessage).tool_calls ?? [])
        : [];

    const names = toolCalls.map((call) => call.name ?? 'unknown');
    const pending: PendingToolSummary[] = toolCalls.map((call) => ({
      name: call.name ?? 'unknown',
      id: call.id,
      argsSummary: summarizeToolArgs(call.args),
    }));

    if (!requiresHitlApproval(names, hitlEnabled)) {
      return { pendingApprovals: [], hitlDecision: undefined };
    }

    const resumeValue: unknown = interrupt({
      pendingTools: pending,
    });
    const decision = this.parseHitlDecision(resumeValue);

    return {
      pendingApprovals: pending,
      hitlDecision: decision,
    };
  }

  private async toolsNode(
    state: CookingAgentStateType,
    config: { configurable?: Record<string, unknown> },
  ) {
    const run = config.configurable?.__cookingRun as
      | {
          callbacks: GraphStreamCallbacks;
          tools: StructuredToolInterface[];
        }
      | undefined;
    const tools =
      run?.tools ?? this.cookingToolsService.buildTools(state.userId);
    const toolsByName = new Map(tools.map((tool) => [tool.name, tool]));
    const callbacks = run?.callbacks ?? {
      onToken: () => undefined,
      onToolStatus: () => undefined,
    };

    const last = state.messages[state.messages.length - 1];
    const toolCalls =
      last && last._getType() === 'ai'
        ? ((last as AIMessage).tool_calls ?? [])
        : [];

    const decision = state.hitlDecision;
    const rejected =
      decision?.decision === 'reject'
        ? new Set(
            toolCalls
              .filter((call) => isMutatingTool(call.name ?? ''))
              .map((call) => call.id ?? call.name ?? ''),
          )
        : new Set<string>();

    const toolMessages: ToolMessage[] = [];
    for (const toolCall of toolCalls) {
      const toolName = toolCall.name ?? 'unknown';
      const callId = toolCall.id ?? toolName;

      if (rejected.has(callId) || rejected.has(toolName)) {
        const note = decision?.note?.trim();
        toolMessages.push(
          new ToolMessage({
            content: note
              ? `User rejected this action: ${note}`
              : 'User rejected this action.',
            tool_call_id: callId,
          }),
        );
        continue;
      }

      if (decision?.decision === 'reject' && isMutatingTool(toolName)) {
        toolMessages.push(
          new ToolMessage({
            content: 'User rejected this action.',
            tool_call_id: callId,
          }),
        );
        continue;
      }

      callbacks.onToolStatus(toolName, statusMessageForTool(toolName));
      const tool = toolsByName.get(toolName);
      let result = 'Tool not found';
      try {
        result = tool
          ? String(await tool.invoke(toolCall.args ?? {}))
          : 'Tool not found';
      } catch (error) {
        this.logger.error(
          `Tool ${toolName} failed for user ${state.userId}`,
          error,
        );
        result = `Tool error: ${error instanceof Error ? error.message : 'unknown'}`;
      }
      toolMessages.push(
        new ToolMessage({
          content: result,
          tool_call_id: callId,
        }),
      );
    }

    return {
      messages: toolMessages,
      hitlDecision: undefined,
      pendingApprovals: [],
    };
  }

  private finalizeNode(state: CookingAgentStateType) {
    const text = this.extractLastAiText(state.messages);
    return { finalText: text || state.finalText };
  }

  private routeAfterAgent(state: CookingAgentStateType) {
    const last = state.messages[state.messages.length - 1];
    const toolCalls =
      last && last._getType() === 'ai'
        ? ((last as AIMessage).tool_calls ?? [])
        : [];
    return toolCalls.length > 0 ? 'hitl_gate' : 'finalize';
  }

  private parseHitlDecision(value: unknown): HitlResumeDecision {
    if (
      value &&
      typeof value === 'object' &&
      'decision' in value &&
      ((value as { decision?: string }).decision === 'approve' ||
        (value as { decision?: string }).decision === 'reject')
    ) {
      const note = (value as { note?: unknown }).note;
      return {
        decision: (value as { decision: 'approve' | 'reject' }).decision,
        note: typeof note === 'string' ? note : undefined,
      };
    }
    return { decision: 'reject' };
  }

  private async invokeModel(
    messages: BaseMessage[],
    tools: StructuredToolInterface[],
    callbacks: GraphStreamCallbacks,
  ): Promise<{
    responseText: string;
    toolCalls: NonNullable<AIMessage['tool_calls']>;
  }> {
    const model = this.createModel(true).bindTools(tools);
    const stream = await model.stream(messages);

    let responseText = '';
    const toolCalls: NonNullable<AIMessage['tool_calls']> = [];
    const toolCallBuilders = new Map<
      number,
      { id?: string; name?: string; args: string }
    >();

    for await (const chunk of stream) {
      if (typeof chunk.content === 'string' && chunk.content.length > 0) {
        responseText += chunk.content;
        callbacks.onToken(chunk.content);
      }

      if (chunk.tool_call_chunks?.length) {
        for (const toolChunk of chunk.tool_call_chunks) {
          const index = toolChunk.index ?? 0;
          const builder = toolCallBuilders.get(index) ?? { args: '' };
          if (toolChunk.id) {
            builder.id = toolChunk.id;
          }
          if (toolChunk.name) {
            builder.name = toolChunk.name;
          }
          if (toolChunk.args) {
            builder.args += toolChunk.args;
          }
          toolCallBuilders.set(index, builder);
        }
      }

      if (chunk.tool_calls?.length) {
        for (const call of chunk.tool_calls) {
          toolCalls.push(call);
        }
      }
    }

    if (toolCalls.length === 0 && toolCallBuilders.size > 0) {
      for (const builder of toolCallBuilders.values()) {
        let args: Record<string, unknown> = {};
        if (builder.args.trim().length > 0) {
          try {
            args = JSON.parse(builder.args) as Record<string, unknown>;
          } catch {
            args = {};
          }
        }
        toolCalls.push({
          id: builder.id ?? builder.name ?? 'tool_call',
          name: builder.name ?? 'unknown',
          args,
          type: 'tool_call',
        });
      }
    }

    return { responseText, toolCalls };
  }

  private createModel(streaming = false): ChatOpenAI {
    const app = this.configService.get<AppConfig>('app')!;
    const apiKey = app.optional.deepseekApiKey;
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY is not configured');
    }

    return new ChatOpenAI({
      apiKey,
      model: app.optional.llmModel ?? 'deepseek-chat',
      temperature: app.optional.llmTemperature ?? 0.2,
      maxTokens: app.optional.llmMaxTokens,
      streaming,
      configuration: app.optional.llmBaseUrl
        ? { baseURL: app.optional.llmBaseUrl }
        : undefined,
    });
  }
}
