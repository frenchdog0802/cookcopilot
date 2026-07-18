# Task 21: Remove legacy OpenAI services

**Phase:** 3 — Cleanup & verification  
**Depends on:** 10, 12, 13  
**Blocks:** None

## Description

Delete hand-rolled OpenAI integration and manual action dispatch after parity tests pass. Tag pre-deletion commit for rollback per design §11.

## Files

| Action | Path |
|--------|------|
| Delete | `backend/src/main/java/com/LarderMind/service/OpenAIService.java` |
| Delete | `backend/src/main/java/com/LarderMind/service/ChatActionService.java` |
| Modify | Any remaining imports/references |

## Pre-work

1. Ensure tasks 12–13 green
2. Optional git tag: `pre-langchain4j-chat` on current main

## Acceptance criteria

- [ ] No references to `OpenAIService` or `ChatActionService` in codebase
- [ ] `mvn compile test` passes
- [ ] Chat send/history endpoints still functional
- [ ] Deleted files recoverable from git history

## How to test

```bash
cd backend && mvn clean test
rg "OpenAIService|ChatActionService" --glob "*.java"  # expect no matches
```

Manual smoke: send chat message, add recipe to menu via chat.
