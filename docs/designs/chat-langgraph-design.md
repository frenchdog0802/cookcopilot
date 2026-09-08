# Design: Chat – LangGraph Migration (Scope C)

**Feature:** [docs/features/chat-langgraph.md](../features/chat-langgraph.md)  
**Slug:** `chat-langgraph`

---

## 1. Architecture overview

Fit: NestJS `ChatModule` remains the HTTP boundary. Agent execution moves into a compiled LangGraph graph owned by `CookingAgentGraphService`. UI history stays in Prisma `ai_messages`; short-term agent memory moves to Postgres Checkpointer keyed by `ChatSession.id`.

```
Client → ChatController → SessionService / History / Quota / Lock
                       → ChatService.stream|send|resume
                       → CookingAgentGraph (StateGraph + Checkpointer)
                       → CookingToolsService + ToolResultCollector
```

Packages: `@langchain/langgraph`, `@langchain/langgraph-checkpoint-postgres` (prod), `MemorySaver` (test). Keep `@langchain/openai` + `@langchain/core`.

---

## 2. Data models

### 2.1 `ChatSession`

```prisma
model ChatSession {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  title     String   @default("New chat") @db.VarChar(200)
  isDefault Boolean  @default(false) @map("is_default")
  lockedAt  BigInt?  @map("locked_at")
  createdAt BigInt?  @map("created_at")
  updatedAt BigInt?  @map("updated_at")

  user     User        @relation(...)
  messages AIMessage[]

  @@index([userId, updatedAt(sort: Desc)])
  @@map("chat_sessions")
}
```

### 2.2 `AIMessage` extensions

- `sessionId String` FK → `ChatSession` onDelete Cascade
- `responseType String?` (assistant rows)
- `cardData Json?` (assistant card payload)
- Index `(sessionId, createdAt Desc)`
- Keep `(userId, createdAt)` index

### 2.3 Backfill

On module init / first resolve:

1. For each distinct `userId` in `ai_messages` without a default session → create `isDefault=true` titled “Chat”.
2. Set `sessionId` on orphan messages to that user’s default session.
3. Users with no messages get a default session lazily on first chat API call.

### 2.4 Checkpointer

- `PostgresSaver.fromConnString(buildDatabaseUrl(...))` then `await setup()`.
- Tables managed by LangGraph (`checkpoints`, etc.) — **do not** model in Prisma.
- `thread_id` = `ChatSession.id` (UUID string, < 255 chars).
- Tests: inject `MemorySaver`.

Env:

| Var | Default | Meaning |
|-----|---------|---------|
| `CHAT_HITL_ENABLED` | `true` (prod/dev); `false` in test setup | Mutating tool interrupt |
| `CHAT_RECURSION_LIMIT` | `12` | Graph recursion_limit |
| `CHAT_USE_MEMORY_CHECKPOINTER` | `false` | Force MemorySaver (local without checkpoint tables) |

---

## 3. Graph state & flow

### 3.1 State (`Annotation.Root`)

| Field | Reducer | Notes |
|-------|---------|-------|
| `messages` | `messagesStateReducer` / `add_messages` | Checkpointer-backed thread |
| `userId` | last-write | Auth identity |
| `sessionId` | last-write | Thread id |
| `recipeContext` | last-write | Optional |
| `finalText` | last-write | Assistant text for UI |
| `interrupted` | last-write | Boolean for controller |
| `pendingApprovals` | last-write | Tool call summaries for SSE |

System prompt is **not** stored in checkpoint forever: prepend as `SystemMessage` in agent node input construction each turn (or store once on first message — prefer prepend each agent invoke from constants to avoid prompt drift in old threads).

### 3.2 Nodes

1. **`agent`** — bind tools, stream model, emit tokens via config callbacks / writer; append AIMessage (+ tool_calls).
2. **`route_after_agent`** — if tool_calls → `hitl_gate`, else → `finalize`.
3. **`hitl_gate`** — if any call is mutating and HITL enabled → `interrupt({ tools: summaries })`; on resume approve continue; reject marks skip set.
4. **`tools`** — execute allowed tools; skipped tools get ToolMessage “User rejected …”; emit status callbacks.
5. **`finalize`** — set `finalText` from last AI content without pending tools.

Edges: `START → agent → (conditional) → hitl_gate|finalize`; `hitl_gate → tools → agent`; `finalize → END`.

### 3.3 HITL policy (`hitl.policy.ts`)

**Mutating (require approval):**  
`createRecipe`, `updateRecipe`, `importRecipeFromUrl`, `addRecipeToMenu`, `planMeals`, `updateMealPlan`, `removeRecipeFromMenu`, `clearMealPlans`, `addPantryItems`, `updatePantryItem`, `removePantryItem`, `organizePantry`, `addItemsToShoppingList`, `updatePreferences`

**Read-only (auto):**  
`listMyRecipes`, `getRecipeDetails`, `listMealPlans`, `listPantry`, `suggestMealsFromPantry`, `getPreferences`

If a batch mixes read + mutate: interrupt once for the whole batch; on approve run all; on reject skip only mutating (still run read-only in same batch — simpler: reject skips **all** pending mutating tools in the interrupt payload; read-only already executed only if gated separately). **Chosen rule:** gate runs before any tool in the batch; if any mutating → interrupt entire batch; approve → run all; reject → ToolMessage rejection for mutating, still execute read-only tools in the batch.

### 3.4 Streaming & interrupt detection

- Prefer `graph.stream(..., { streamMode: ['messages', 'updates', 'custom'] })` or `streamEvents`.
- Map AI token chunks → `onToken`.
- Custom/status from tools node → `onToolStatus`.
- If result `__interrupt__` / `graph.isInterrupted` → controller sends SSE `interrupt` and **does not** `done` with final text yet; holds session lock until resume or timeout/disconnect.
- Alternative for sync `send`: return `type: 'interrupt'` with `data.pendingTools`.

### 3.5 Resume

`Command({ resume: { decision: 'approve'|'reject', note? } })` with same `configurable.thread_id`.

Quota: not incremented on resume.

---

## 4. Interface design

### Sessions

```ts
// GET /api/chat/sessions → { sessions: [{ id, title, isDefault, updatedAt }] }
// POST /api/chat/sessions { title? } → session
// PATCH /api/chat/sessions/:id { title } → session
// DELETE /api/chat/sessions/:id → { deleted: true }
```

### Send / Stream / Resume

```ts
ChatSendRequestDto {
  message: string;
  sessionId?: string;
  recipeContext?: { recipeId?: string; recipeName?: string };
}

ChatResumeRequestDto {
  sessionId: string;
  decision: 'approve' | 'reject';
  note?: string;
}

// interrupt response / SSE
{ type: 'interrupt', message: string, data: { sessionId, pendingTools: [{ name, argsSummary }] } }
```

History DTO adds optional `responseType`, `cardData`.

### Locking

`ChatSessionGuard.tryAcquire(userId, sessionId)`:

1. In-memory map key `` `${userId}:${sessionId}` ``
2. Plus `UPDATE chat_sessions SET locked_at = now WHERE id AND locked_at IS NULL` (or stale > STREAM_TIMEOUT_MS)

Release clears memory + `locked_at = null`.

---

## 5. Business logic flow

### Send/stream happy path

1. Resolve session (default if missing); ownership check.
2. Soft content guard.
3. Acquire lock.
4. Increment AI quota (send only).
5. `toolResultCollector.begin(userId)`.
6. Persist user `AIMessage` (stream: before graph; send: after success or on error as today).
7. Invoke/stream graph with `thread_id = sessionId`.
8. If interrupt → SSE interrupt / JSON interrupt; **keep lock** until resume path or client close/timeout.
9. If complete → map tool collector → response; save assistant with `responseType`/`cardData`; release lock.

### Resume

1. Ownership + lock acquire (or continue held lock from stream — design: resume acquires if free, or same connection holds; **HTTP resume always tryAcquire**).
2. No quota increment.
3. `begin` collector; `Command` resume; same completion path.

### Delete session

Delete Prisma session (cascade messages); `checkpointer.deleteThread(sessionId)` if API available, else best-effort ignore.

---

## 6. Edge cases & errors

| Case | Handling |
|------|----------|
| No DEEPSEEK key | User-facing generic / config error |
| Recursion limit | Catch GraphRecursionError → friendly message |
| Stale lock | Treat `lockedAt` older than `STREAM_TIMEOUT_MS` as free |
| Reject HITL | Tools get rejection ToolMessages; agent explains |
| Delete default while others exist | OK; if no sessions left, recreate default |
| Card data missing on old rows | UI falls back to text-only |

---

## 7. Performance & security

- Bound tool iterations via `recursion_limit`.
- Keep `MAX_TOOL_LIST_SIZE` / recipe step caps in tools.
- Session ownership on every id-bearing route.
- No public access to checkpoint tables.
- `ToolResultCollector` remains request-scoped by userId (single turn); do not share across users.

---

## 8. Frontend design notes

**Web:** sidebar or top session chips; interrupt banner with Approve/Reject; `streamSend` handles `interrupt` without closing as error.

**Mobile:** session picker modal; on `type: 'interrupt'` show Alert/Modal; call `resume`; fix body to `recipeContext`.

**History:** map `cardData`/`responseType` into existing card renderers.

---

## 9. File plan

| Path | Role |
|------|------|
| `src/chat/graph/cooking-agent.state.ts` | Annotations |
| `src/chat/graph/hitl.policy.ts` | Mutating set |
| `src/chat/graph/cooking-agent.graph.ts` | Build/compile |
| `src/chat/graph/cooking-agent-graph.service.ts` | Nest wrapper |
| `src/chat/sessions/chat-sessions.service.ts` | CRUD + default + lock DB |
| `src/chat/chat.service.ts` | Thin orchestrator |
| `src/chat/chat.controller.ts` | New routes |
| `src/chat/chat-history.service.ts` | Session-scoped |
| `src/chat/chat-session.guard.ts` | Composite key |
| Remove/deprecate `chat-memory.service.ts` | After graph lands |

---

## 10. Testing strategy

- Unit: HITL policy; session resolve/backfill; guard keys; graph routing with mocked model (or mock graph service).
- e2e: sessions CRUD + history filter (mock ChatService/graph).
- Manual: stream interrupt → resume with live key.
