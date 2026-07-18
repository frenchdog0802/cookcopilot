# Task 10: Rewrite ChatController send

**Phase:** 1 — Backend foundation  
**Depends on:** 04, 05, 09  
**Blocks:** 13, 21

## Description

Replace OpenAI REST + JSON parsing with LangChain4j `CookingAssistant.chat()`. Preserve `POST /api/chat/send` contract, prompt guard, recipe context enrichment, history load, persistence, and response envelope mapping.

## Files

| Action | Path |
|--------|------|
| Modify | `backend/src/main/java/com/CookCopilot/controller/ChatController.java` |
| Modify | `backend/src/main/java/com/CookCopilot/dto/ChatSendRequest.java` (add `@Size(max=4000)` if missing) |

## Implementation flow

1. `FORBIDDEN_PATTERNS` check → `{ type: "error", message: friendly }` (not `refusal`)
2. `userContext.setUserId(userId)`
3. Build enriched message (recipe context prefix unchanged)
4. `chatHistoryService.loadRecent(userId, 20)` — seed memory or prepend (per design §2.7)
5. `cookingAssistant.chat(userId, enrichedMessage)`
6. On success: save user (raw message) + assistant rows via `ChatHistoryService`
7. If `toolResultCollector.hasResult()` → map to `recipe_created` | `shopping_list_updated` | `action_result`
8. Else → `{ type: "text", message: aiText, data: {} }`
9. On OpenAI failure: log; return `error`; persist user message only (optional audit)

Remove dependency on `OpenAIService` / `ChatActionService` / JSON `ObjectMapper` parsing in this method (keep old beans until task 21 if needed for rollback).

## Acceptance criteria

- [ ] Request body unchanged (`message`, optional `recipe_context`)
- [ ] Response types: `text`, `recipe_created`, `shopping_list_updated`, `action_result`, `error`
- [ ] Dropped types not emitted: `recipe`, `tip`, `clarification`, `refusal`, `action_error`
- [ ] Prompt guard runs before any OpenAI call
- [ ] `UserContext` set on same request thread before assistant call
- [ ] User message persisted without pantry prefix (design default)
- [ ] Meal-plan actions still return compatible `action_result` data

## How to test

1. Controller unit test with `@MockBean CookingAssistant`: guard pattern → error, assistant not called.
2. Mock assistant returns text → `type: text`.
3. Mock TRC with `createRecipe` → `type: recipe_created` with expected data keys.
4. Integration test (task 13): end-to-end with WireMock OpenAI.
