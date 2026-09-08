import { Annotation, messagesStateReducer } from '@langchain/langgraph';
import type { BaseMessage } from '@langchain/core/messages';

export type RecipeContextState = {
  recipeId?: string;
  recipeName?: string;
};

export type PendingToolSummary = {
  name: string;
  argsSummary: string;
  id?: string;
};

export type HitlResumeDecision = {
  decision: 'approve' | 'reject';
  note?: string;
};

export const CookingAgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  userId: Annotation<string>({
    reducer: (_left, right) => right,
    default: () => '',
  }),
  sessionId: Annotation<string>({
    reducer: (_left, right) => right,
    default: () => '',
  }),
  recipeContext: Annotation<RecipeContextState | undefined>({
    reducer: (_left, right) => right,
    default: () => undefined,
  }),
  finalText: Annotation<string>({
    reducer: (_left, right) => right,
    default: () => '',
  }),
  pendingApprovals: Annotation<PendingToolSummary[]>({
    reducer: (_left, right) => right,
    default: () => [],
  }),
  hitlDecision: Annotation<HitlResumeDecision | undefined>({
    reducer: (_left, right) => right,
    default: () => undefined,
  }),
});

export type CookingAgentStateType = typeof CookingAgentState.State;
export type CookingAgentStateUpdate = typeof CookingAgentState.Update;
