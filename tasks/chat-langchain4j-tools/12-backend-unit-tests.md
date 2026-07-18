# Task 12: Backend unit tests

**Phase:** 1 — Backend foundation  
**Depends on:** 06, 07, 08, 10  
**Blocks:** 21

## Description

Add focused unit tests for tools, request-scoped collector, chat history service, and controller prompt guard per design §9.1.

## Files

| Action | Path |
|--------|------|
| Create | `backend/src/test/java/com/CookCopilot/service/CookingToolsTest.java` |
| Create | `backend/src/test/java/com/CookCopilot/service/ToolResultCollectorTest.java` |
| Create | `backend/src/test/java/com/CookCopilot/service/ChatHistoryServiceTest.java` |
| Create | `backend/src/test/java/com/CookCopilot/controller/ChatControllerTest.java` |

## Test cases

| Target | Cases |
|--------|-------|
| `CookingTools.createRecipe` | Happy path; 0 ingredients; >30 throws; invalid UUID |
| `CookingTools.addItemsToShoppingList` | Bulk insert; empty list; duplicate names |
| `CookingTools.addRecipeToMenu` | Own recipe succeeds; other user's recipe fails |
| `ToolResultCollector` | Set/get/hasResult per request |
| `ChatHistoryService` | Load order ASC; save pair; limit 20 |
| `ChatController` guard | Each forbidden pattern → error without calling assistant |

Use `@MockBean CookingAssistant` in controller tests.

## Acceptance criteria

- [ ] All listed cases implemented
- [ ] `mvn test` passes without real `OPENAI_API_KEY`
- [ ] No network calls to OpenAI in unit tests
- [ ] Tests run in CI-friendly time (<30s for this suite)

## How to test

```bash
cd backend && mvn test -Dtest=CookingToolsTest,ToolResultCollectorTest,ChatHistoryServiceTest,ChatControllerTest
```
