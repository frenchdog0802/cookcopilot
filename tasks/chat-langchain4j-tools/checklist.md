# Checklist: chat-langchain4j-tools

Mark each item when acceptance criteria are met and verified.

## Phase 1 — Backend foundation

- [x] **01** — LangChain4j Maven dependency added; backend compiles
- [x] **02** — `langchain4j.open-ai.chat-model.*` in `application.yml`; env vars mapped
- [x] **03** — `idx_ai_messages_user_created` index; repository query methods added
- [x] **04** — `UserContext` and `ToolResultCollector` request-scoped beans
- [x] **05** — `ChatHistoryService` load/save with 20/50 limits and ordering
- [x] **06** — `CookingTools`: `listMyRecipes`, `addRecipeToMenu`, `removeRecipeFromMenu`
- [x] **07** — `CookingTools.createRecipe` with ingredient resolution and TRC
- [x] **08** — `CookingTools.addItemsToShoppingList` with bulk insert and TRC
- [x] **09** — `CookingAssistant` interface + `LangChain4jConfig` bean
- [x] **10** — `ChatController.send` rewritten; prompt guard; persistence; response mapping
- [x] **11** — `GET /api/chat/history` returns last 50 messages ascending
- [x] **12** — Unit tests: tools, TRC, ChatHistoryService, controller guard
- [x] **13** — Integration tests: send (text + tool), history auth isolation

## Phase 2 — Frontend

- [x] **14** — Web `chat.ts`: updated `ChatResponse` types + `getHistory()`
- [x] **15** — Web: load history on mount; replace welcome when non-empty
- [x] **16** — Web: `recipe_created` card with View Recipe / Add to Menu
- [x] **17** — Web: `shopping_list_updated` card with chips + View Shopping List
- [x] **18** — Web: `App.tsx` deep link to Recipe Manager via `selectedRecipeId`
- [x] **19** — Mobile `chat.ts`: types + `getHistory()`
- [x] **20** — Mobile: history on mount + both new card types + navigation

## Phase 3 — Cleanup & verification

- [x] **21** — `OpenAIService` and `ChatActionService` removed; build green
- [x] **22** — `GET /api/chat/actions` lists updated tool names
- [ ] **23** — Manual QA + rollback drill completed

## Manual QA (task 23)

- [ ] Meal-plan action via chat returns `action_result`
- [ ] Create recipe from chat appears in Recipe Manager
- [ ] Shopping list items visible after tool
- [ ] Page refresh shows prior messages (web)
- [ ] Mobile navigation buttons work
- [ ] Rollback to pre-migration commit restores stateless chat
