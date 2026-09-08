/** Keep batches small so streaming tool-call JSON is less likely to truncate. */
export const MAX_TOOL_LIST_SIZE = 8;
export const MAX_RECIPE_STEPS = 12;

/**
 * In-process message window. Must be large enough for a multi-tool turn without
 * evicting mid tool-call / tool-result pairs.
 */
export const AI_CONTEXT_MESSAGE_LIMIT = 80;

/** DB user/assistant messages to preload per turn. */
export const AI_CONTEXT_SEED_LIMIT = 16;

export const UI_HISTORY_MESSAGE_LIMIT = 50;
export const MAX_MESSAGE_LENGTH = 4000;

export const STREAM_TIMEOUT_MS = 300_000;
