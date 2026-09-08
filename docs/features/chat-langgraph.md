# Feature: Chat – LangGraph Migration (Scope C)

**Status:** Implemented  
**Scope:** Backend NestJS (`backend-node`) + Web (`AICookingAssistant.tsx`) + Mobile (`AICookingAssistantScreen.tsx`)  
**Slug:** `chat-langgraph`

---

## 1. Summary

Migrate the NestJS cooking chat agent from a hand-rolled LangChain JS `while(true)` tool loop to an explicit **LangGraph `StateGraph`**, and deliver production capabilities:

- Multi-session conversations per user
- Postgres Checkpointer (`thread_id` = session id)
- Human-in-the-loop (HITL) approval before mutating tools
- Bounded agent recursion (`recursion_limit`)
- Persist UI card payloads so history reload keeps action cards

### What changes

| Area | Before | After |
|------|--------|--------|
| Agent runtime | `ChatService.runTurn` manual loop | LangGraph `StateGraph` (agent → HITL gate → tools → finalize) |
| Short-term memory | In-process `ChatMemoryService` | Postgres Checkpointer (+ MemorySaver in tests) |
| Sessions | One implicit thread per user | `ChatSession` table; API CRUD |
| History | Text-only `AIMessage` | Per-session; optional `responseType` / `cardData` |
| HITL | None | Interrupt mutating tools; `POST /resume`; SSE `interrupt` |
| Concurrency lock | In-memory per `userId` | Per `(userId, sessionId)` + DB `lockedAt` for multi-instance |
| Clients | Web SSE; Mobile sync send | Both: sessions + HITL; Mobile fixes `recipeContext` |

---

## 2. Requirements

### 2.1 Backend – LangGraph

- Add `@langchain/langgraph` and `@langchain/langgraph-checkpoint-postgres`.
- Replace `runTurn` with a compiled graph:
  - Nodes: `agent`, `hitl_gate`, `tools`, `finalize`
  - Conditional edges after agent (tools vs finalize) and after HITL (interrupt vs tools)
- Default `recursion_limit` = 12 (env `CHAT_RECURSION_LIMIT`).
- Keep DeepSeek via existing `ChatOpenAI` + env (`DEEPSEEK_API_KEY`, `LLM_*`).
- Keep `CookingToolsService` tools; userId remains closed over (not model-supplied).
- Remove reliance on in-process message window for agent context; checkpointer owns thread messages.
- `tokenIn` / `tokenOut` remain `0` in this feature (no token accounting change).

### 2.2 Backend – Sessions & persistence

- New `ChatSession`: `id`, `userId`, `title`, `isDefault`, `lockedAt`, timestamps.
- `AIMessage.sessionId` required (FK cascade); add optional `responseType`, `cardData` (JSON).
- On deploy/boot migrate: for each user with messages (or any user hitting chat), ensure one `isDefault` session; backfill `sessionId`.
- Missing `sessionId` on API → resolve to user’s default session (create if absent).
- Delete session deletes messages and clears related checkpointer thread.
- Clear history is session-scoped (default session if omitted).

### 2.3 Backend – HITL

- Mutating tools require approval when `CHAT_HITL_ENABLED` is true (default **true** in production config; tests may disable).
- Mutating set (non-exhaustive list locked in design): create/update recipe, meal plan writes/clears, pantry writes/organize, shopping list add, etc. Read-only tools pass through.
- On interrupt: do not execute mutating tools; surface pending tool summary to client.
- Quota: charge **once** on initial send/stream; **resume does not** re-charge.
- Resume body: `{ sessionId, decision: 'approve' | 'reject', note? }`.
- Reject: skip mutating tool execution with a tool error message; graph continues to produce a final assistant reply.

### 2.4 Backend – API

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/chat/sessions` | List user’s sessions |
| POST | `/api/chat/sessions` | Create (`title?`) |
| PATCH | `/api/chat/sessions/:id` | Rename |
| DELETE | `/api/chat/sessions/:id` | Delete session + messages + checkpoints |
| GET | `/api/chat/history?sessionId=` | Default → default session |
| DELETE | `/api/chat/history?sessionId=` | Clear one session’s UI messages + reset thread |
| POST | `/api/chat/send` | Optional `sessionId` |
| POST | `/api/chat/stream` | SSE + `interrupt` event |
| POST | `/api/chat/resume` | Continue after HITL |
| GET | `/api/chat/actions` | Unchanged tool name list |

Preserve envelope `{ success, message, data }` and soft chat errors (`type: 'error'` inside `ok()`).

SSE events: `token`, `status`, `interrupt`, `done`, `error`.

### 2.5 Frontend – Web

- Session list, create, switch, rename, delete.
- Stream with `sessionId`; handle `interrupt` → approve/reject → `resume`.
- History hydrate per session; restore cards from `cardData` when present.

### 2.6 Frontend – Mobile

- Session + HITL (modal acceptable).
- Fix request field to `recipeContext` (camelCase).
- Align send/resume contracts; prefer streaming when practical, else sync send + interrupt/resume polling-equivalent via resume endpoint after interrupt response type.

### 2.7 Out of scope

- Implementing real `importRecipeFromUrl` scraping.
- Token usage metering.
- Multi-agent supervisor topology.
- Changing Spring `backend/` (Nest only).

---

## 3. Edge cases

- User has no sessions → auto-create default on first chat/history.
- Delete last/default session → recreate empty default (or forbid delete of sole default; design: allow delete then recreate default).
- Concurrent send on same session → busy error; other sessions unrestricted.
- Client disconnect mid-stream → release lock; checkpointer may retain interrupted state (resume may still work if interrupt was persisted).
- Tool JSON truncate → existing user-facing error mapping preserved.
- HITL disabled → mutating tools run immediately (dev/test).
- Quota exceeded → no graph invoke; resume never charges.

---

## 4. Security

- All chat routes JWT-protected; session ownership checked (`session.userId === currentUser`).
- Tools still bind `userId` from auth, never from LLM args.
- Soft `FORBIDDEN_PATTERNS` retained.
- Interrupt payloads must not leak other users’ data.
- Checkpointer tables must not be writable via app public APIs.

---

## 5. UX

- Clear “waiting for approval” state with tool names and short args summary.
- Approve / Reject primary actions; optional note on reject.
- New chat creates a fresh session (empty history).
- Switching sessions loads that session’s history only.

---

## 6. Performance

- `recursion_limit` caps tool loops.
- Keep tool batch size limits (`MAX_TOOL_LIST_SIZE`, etc.).
- Stream timeout 5 minutes unchanged.
- Postgres checkpointer enables multi-instance memory; avoid unbounded in-process caches.

---

## 7. Success criteria

- [ ] Chat turns run via LangGraph; no `while(true)` agent loop in `ChatService`
- [ ] Multi-session CRUD works on web and mobile
- [ ] Mutating tools interrupt when HITL enabled; resume approve/reject works
- [ ] Default session backfills existing `ai_messages`
- [ ] History can restore card metadata when saved
- [ ] Unit/e2e cover sessions + HITL routing; lint/typecheck/tests pass
