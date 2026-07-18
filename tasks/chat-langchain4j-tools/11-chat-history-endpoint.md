# Task 11: GET /api/chat/history endpoint

**Phase:** 1 — Backend foundation  
**Depends on:** 05  
**Blocks:** 14, 15, 19, 20

## Description

Add authenticated endpoint to load the last 50 chat messages for UI hydration on mount.

## Files

| Action | Path |
|--------|------|
| Modify | `backend/src/main/java/com/LarderMind/controller/ChatController.java` |
| Create | `backend/src/main/java/com/LarderMind/dto/ChatHistoryResponse.java` (optional) |
| Create | `backend/src/main/java/com/LarderMind/dto/ChatHistoryMessageDto.java` (optional) |

## Implementation

**Endpoint:** `GET /api/chat/history`

**Response:**

```json
{
  "messages": [
    { "id": "uuid", "role": "user", "content": "...", "createdAt": 1718000000 }
  ]
}
```

- Last 50 rows via `findTop50ByUserIdOrderByCreatedAtDesc`, reversed to ascending
- JWT user only; no cross-user access
- No system messages or token counts exposed

## Acceptance criteria

- [ ] Returns 200 with `messages` array for authenticated user
- [ ] Maximum 50 messages, ascending by `created_at`
- [ ] Empty history → `{ "messages": [] }`
- [ ] User A cannot see User B's messages
- [ ] Endpoint protected by existing Spring Security JWT config

## How to test

1. Integration test: insert 55 messages for user → response has 50, oldest-of-window first.
2. Two users: each sees only own messages.
3. Unauthenticated request → 401.
