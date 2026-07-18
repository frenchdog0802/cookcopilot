# Task 13: Backend integration tests

**Phase:** 1 — Backend foundation  
**Depends on:** 10, 11  
**Blocks:** 21

## Description

Add integration tests for chat send (text and tool paths) and history endpoint with real DB (Testcontainers PostgreSQL recommended).

## Files

| Action | Path |
|--------|------|
| Create | `backend/src/test/java/com/CookCopilot/integration/ChatIntegrationTest.java` |

## Test cases

| Test | Setup |
|------|-------|
| Send without tool | Mock `OpenAiChatModel` or WireMock OpenAI → `type: text`, `ai_messages` rows |
| Send triggering `createRecipe` | Mock tool call → verify `recipes` + `ai_messages` |
| History endpoint | Insert fixtures → assert ordering, limit 50, auth isolation |
| OpenAI failure | Mock 5xx → `type: error`, assistant row not persisted |

## Acceptance criteria

- [ ] At least 4 integration scenarios pass against Testcontainers PG (or project-standard test DB)
- [ ] Tool path verifies domain writes in DB
- [ ] History ordering matches spec (ASC, max 50)
- [ ] Tests do not require committed API keys

## How to test

```bash
cd backend && mvn test -Dtest=ChatIntegrationTest
```

Ensure Docker available for Testcontainers, or document H2 fallback if project uses it.
