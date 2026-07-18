# Tasks: Chat – LangChain4j Migration + Tool Calls

**Feature:** [chat-langchain4j-tools](../../docs/features/chat-langchain4j-tools.md)  
**Design:** [chat-langchain4j-tools](../../docs/design/chat-langchain4j-tools.md)

## How to use

1. Work tasks in order within each phase; cross-phase dependencies are noted in each task file.
2. Mark completion in [checklist.md](./checklist.md) and update [progress.md](./progress.md).
3. Each task is independently completable, testable, and includes acceptance criteria.

## Phases

| Phase | Tasks | Focus |
|-------|-------|-------|
| 1 — Backend foundation | 01–13 | Dependency, DB, services, controller, tests |
| 2 — Frontend | 14–20 | Web + mobile API clients, UI cards, history |
| 3 — Cleanup & verification | 21–23 | Legacy removal, actions endpoint, QA |

## Task index

| # | Task | Status |
|---|------|--------|
| 01 | [Add LangChain4j dependency](./01-add-langchain4j-dependency.md) | ⬜ |
| 02 | [Add LangChain4j application config](./02-add-langchain4j-application-config.md) | ⬜ |
| 03 | [DB index and repository methods](./03-db-index-and-repository-methods.md) | ⬜ |
| 04 | [Request-scoped UserContext and ToolResultCollector](./04-request-scoped-beans.md) | ⬜ |
| 05 | [ChatHistoryService](./05-chat-history-service.md) | ⬜ |
| 06 | [CookingTools — menu tools](./06-cooking-tools-menu.md) | ⬜ |
| 07 | [CookingTools — createRecipe](./07-cooking-tools-create-recipe.md) | ⬜ |
| 08 | [CookingTools — addItemsToShoppingList](./08-cooking-tools-shopping-list.md) | ⬜ |
| 09 | [CookingAssistant and LangChain4jConfig](./09-cooking-assistant-config.md) | ⬜ |
| 10 | [Rewrite ChatController send](./10-rewrite-chat-controller-send.md) | ⬜ |
| 11 | [GET /api/chat/history endpoint](./11-chat-history-endpoint.md) | ⬜ |
| 12 | [Backend unit tests](./12-backend-unit-tests.md) | ⬜ |
| 13 | [Backend integration tests](./13-backend-integration-tests.md) | ⬜ |
| 14 | [Web API client updates](./14-web-api-client.md) | ⬜ |
| 15 | [Web history hydration on mount](./15-web-history-hydration.md) | ⬜ |
| 16 | [Web recipe_created card](./16-web-recipe-created-card.md) | ⬜ |
| 17 | [Web shopping_list_updated card and navigation](./17-web-shopping-list-card.md) | ⬜ |
| 18 | [Web App.tsx navigation for View Recipe](./18-web-app-navigation.md) | ⬜ |
| 19 | [Mobile API client updates](./19-mobile-api-client.md) | ⬜ |
| 20 | [Mobile history and response cards](./20-mobile-history-and-cards.md) | ⬜ |
| 21 | [Remove legacy OpenAI services](./21-remove-legacy-services.md) | ⬜ |
| 22 | [Update GET /api/chat/actions](./22-update-actions-endpoint.md) | ⬜ |
| 23 | [Regression and rollback verification](./23-regression-verification.md) | ⬜ |
