# Task 05: ChatHistoryService

**Phase:** 1 — Backend foundation  
**Depends on:** 03  
**Blocks:** 10, 11

## Description

Implement load/save of `AIMessage` rows and conversion to/from LangChain4j `ChatMessage` for controller-managed history.

## Files

| Action | Path |
|--------|------|
| Create | `backend/src/main/java/com/LarderMind/service/ChatHistoryService.java` |

## Implementation

Methods:

| Method | Behavior |
|--------|----------|
| `loadRecent(UUID userId, int limit)` | Query repo DESC, reverse to ascending, map to `ChatMessage` |
| `saveUserMessage(UUID userId, String content)` | `role=user`; store **stripped** user text (no pantry prefix) |
| `saveAssistantMessage(UUID userId, String content, int tokenIn, int tokenOut)` | `role=assistant`; tokens default 0 |

Map roles: `user` → `UserMessage`, `assistant` → `AiMessage`.

## Acceptance criteria

- [ ] `loadRecent(userId, 20)` returns messages in ascending `created_at` order
- [ ] Limit respected (never more than N messages)
- [ ] `saveUserMessage` / `saveAssistantMessage` persist rows with correct `userId` and `role`
- [ ] Service does not call OpenAI or HTTP
- [ ] Empty history returns empty list (no NPE)

## How to test

Unit test with mocked `AIMessageRepository`:

1. Insert 25 fixtures; `loadRecent(..., 20)` returns 20 oldest-of-recent in ASC order.
2. Save pair; verify two `save()` calls with expected entity fields.

Integration test: insert rows in DB, call service, assert ordering.
