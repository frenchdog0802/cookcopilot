# Feature: Chat – LangChain4j Migration + Tool Calls

**Status:** Planning  
**Scope:** Backend (Spring Boot) + Web Frontend (`AICookingAssistant.tsx`) + Mobile (`AICookingAssistantScreen.tsx`)

---

## 1. Summary

Migrate the existing chat feature from a hand-rolled OpenAI REST + JSON-parsing approach to
**LangChain4j** with native function/tool calling. Add two new tools (`create_recipe`,
`add_items_to_shopping_list`) and wire up persistent chat history using the existing `AIMessage`
entity that was stubbed but never connected.

### What changes

| Area | Before | After |
|---|---|---|
| AI integration | Raw `RestTemplate` → `openai/v1/chat/completions` | LangChain4j `AiServices` + `OpenAiChatModel` |
| Tool invocation | AI returns JSON `{"type":"action","data":{"action":"..."}}`, parsed manually | Native OpenAI function calling via `@Tool` annotations |
| Tools available | `add_recipe_to_menu`, `remove_recipe_from_menu`, `list_my_recipes` | + `create_recipe`, `add_items_to_shopping_list` |
| Chat history | Stateless – every request is a single-turn call | Persisted to `ai_messages` table; last 20 messages loaded as context |
| Frontend | Handles `type: action_result` cards | + new `type: recipe_created` and `type: shopping_list_updated` cards |

---

## 2. Requirements

### 2.1 Backend

#### 2.1.1 LangChain4j dependency

Add to `pom.xml`:

```xml
<!-- LangChain4j – OpenAI Spring Boot starter (auto-configures OpenAiChatModel) -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai-spring-boot-starter</artifactId>
    <version>1.0.0</version>
</dependency>
```

Map existing `application.yml` keys to LangChain4j properties:

```yaml
langchain4j:
  open-ai:
    chat-model:
      api-key: ${OPENAI_API_KEY}
      model-name: ${app.openai.model:gpt-4o-mini}
      temperature: ${app.openai.temperature:0.6}
      max-tokens: ${app.openai.max-tokens:1000}
```

> `app.openai.*` keys can stay as-is and be referenced via `${…}` so no env-var renames
> are needed.

#### 2.1.2 AiServices assistant

Define a single-method interface:

```java
public interface CookingAssistant {
    @SystemMessage("""
        You are an AI Cooking Assistant for CookCopilot.
        ONLY answer questions about food, recipes, cooking, and ingredients.
        Refuse anything unrelated to food.
        When the user asks you to create a recipe, use the createRecipe tool.
        When the user asks to add items to the shopping list, use the addItemsToShoppingList tool.
        """)
    String chat(@MemoryId UUID userId, @UserMessage String userMessage);
}
```

Build via `AiServices.builder(CookingAssistant.class)`:
- `chatModel(openAiChatModel)`
- `chatMemoryProvider(userId -> MessageWindowChatMemory.withMaxMessages(20))`  
  *(initially in-memory; see §4 for DB-backed variant)*
- `tools(cookingTools)` — the `@Tool` bean described below

#### 2.1.3 CookingTools – tool definitions

One Spring `@Component` bean. The `userId` is available via a **request-scoped** holder bean
(see §3.3) so the AI cannot forge or influence the identity.

| Tool method | Parameters AI provides | What it does | Returns to AI |
|---|---|---|---|
| `listMyRecipes()` | – | Queries `recipe_repository.findByUserId(userId)` | List of name + id |
| `addRecipeToMenu(recipeId, mealType)` | `recipeId: UUID`, `mealType: String` | Saves `MealPlan` row | Confirmation string |
| `removeRecipeFromMenu(mealPlanId)` | `mealPlanId: UUID` | Deletes `MealPlan` row | Confirmation string |
| `createRecipe(name, description, ingredients, steps)` | See below | Creates `Recipe` + `RecipeIngredient` rows | Recipe id + name |
| `addItemsToShoppingList(items)` | See below | Creates `ShoppingListItem` rows (bulk) | Count of items added |

**`createRecipe` parameter schema (what the AI must provide):**

```
name:        String (required) – recipe title
description: String (optional)
steps:       List<String> – ordered step-by-step instructions (maps to Recipe.steps)
ingredients: List<{name, quantity, unit, note}> – quantity and unit are optional strings
```

The tool implementation must:
1. Create or look up each `Ingredient` by name (case-insensitive) via `IngredientRepository`
2. Save the `Recipe` entity
3. Save one `RecipeIngredient` per ingredient
4. Write the tool result into the `ToolResultCollector` (§2.1.4)

**`addItemsToShoppingList` parameter schema:**

```
items: List<{name, quantity, unit}>
```

Implementation:
1. Create or look up each `Ingredient` by name
2. Bulk-insert `ShoppingListItem` rows for the current user
3. Write result into `ToolResultCollector`

#### 2.1.4 ToolResultCollector (request-scoped)

A `@RequestScope @Component` that tools write into so `ChatController` can read the result
after the AI call finishes and construct the correct response envelope.

```java
@Component @RequestScope
public class ToolResultCollector {
    private String toolName;
    private Map<String, Object> data;
    // setters / getters
}
```

This avoids coupling the AI's string output to the frontend's structured data needs.

#### 2.1.5 Chat history persistence

After each successful AI exchange in `ChatController`:
1. Save user message: `AIMessage{role="user", content=userMessage, userId}`
2. Save assistant message: `AIMessage{role="assistant", content=aiResponse, userId}`

The `MessageWindowChatMemory` used by LangChain4j is **in-memory** (per JVM restart it resets).
To restore history across restarts, pre-load the last 20 `AIMessage` rows for the user into the
memory on first access (lazy init via `ChatMemoryProvider`).

The `AIMessage` entity already has `tokenIn`/`tokenOut` fields — populate them from
`OpenAiChatModel`'s usage metadata if available; otherwise leave as 0.

> **No `session_id`**: all messages for a user are one continuous conversation. If session
> isolation is needed later, a `session_id` UUID column must be added to `ai_messages`.

#### 2.1.6 Prompt injection guard

Keep the existing `FORBIDDEN_PATTERNS` filter in `ChatController`. LangChain4j does not
provide prompt-injection defense by default.

#### 2.1.7 Updated response envelope

`ChatController.send()` returns `ChatSendResponse` with types:

| `type` | When | `data` contents |
|---|---|---|
| `text` | Normal AI text reply | `{}` |
| `recipe_created` | `createRecipe` tool ran | `{recipeId, recipeName, ingredientCount, steps}` |
| `shopping_list_updated` | `addItemsToShoppingList` ran | `{itemsAdded: N, items: [{name, quantity, unit}]}` |
| `action_result` | `addRecipeToMenu` / `removeRecipeFromMenu` ran | same as today |
| `error` | AI call failed / tool threw | `{}` |

Old types `recipe`, `tip`, `clarification`, `refusal`, `action_error` are dropped (LangChain4j
handles the turn internally).

---

### 2.2 Frontend – Web (`AICookingAssistant.tsx`)

Add two new message bubble variants:

**`recipe_created` card:**
- Recipe name (bold), ingredient count, step count
- "View Recipe" button → navigates to RecipeManager with recipe pre-selected
- "Add to Menu" button → calls `POST /api/meal-plan` directly

**`shopping_list_updated` card:**
- "Added N items to your shopping list" with a chips list of item names
- "View Shopping List" button → navigates to ShoppingList view

Everything else stays the same. The API contract (`POST /api/chat/send`) is unchanged.

---

### 2.3 Mobile (`AICookingAssistantScreen.tsx`)

Mirror the same two new card types. Reuse existing navigation patterns
(`navigation.navigate('ShoppingList')`, `navigation.navigate('RecipeManager')`).

---

## 3. Architecture

```
POST /api/chat/send
        │
        ▼
ChatController
  ├── prompt injection guard
  ├── CookingAssistant.chat(userId, message)
  │       │  LangChain4j
  │       ├── OpenAiChatModel  ──► OpenAI API (function calling)
  │       │                              │ tool call requested
  │       └── CookingTools (@Tool)  ◄───┘
  │               ├── RecipeService / RecipeIngredientRepository
  │               ├── ShoppingListService / IngredientRepository
  │               ├── MealPlanRepository
  │               └── ToolResultCollector (writes result)
  │
  ├── persist AIMessage (user + assistant)
  ├── read ToolResultCollector
  └── return ChatSendResponse{type, message, data}
```

### 3.1 Per-user chat memory

```java
@Bean
CookingAssistant cookingAssistant(OpenAiChatModel model, CookingTools tools) {
    return AiServices.builder(CookingAssistant.class)
        .chatModel(model)
        .chatMemoryProvider(userId ->
            MessageWindowChatMemory.builder()
                .id(userId)
                .maxMessages(20)
                .chatMemoryStore(dbBackedMemoryStore) // §3.2
                .build())
        .tools(tools)
        .build();
}
```

### 3.2 DB-backed memory store

Implement `ChatMemoryStore` to read/write `AIMessage` rows:

```java
public class JpaChatMemoryStore implements ChatMemoryStore {
    // getMessages(userId) → load last 20 AIMessage rows → convert to LangChain4j ChatMessage
    // updateMessages(userId, messages) → diffing is complex; prefer appending in ChatController
}
```

Simple alternative (avoids implementing the full store): do not use `ChatMemoryStore`;
instead, in `ChatController`, load the last 20 messages before the call, convert them to
`ChatMessage` objects, and pass them as history manually. This keeps memory management explicit.

**Recommendation:** use the simpler manual-history approach initially. Switch to the full
`ChatMemoryStore` if hot-reload of history becomes a requirement.

### 3.3 UserId threading

```java
@Component @RequestScope
public class UserContext {
    private UUID userId;
}
```

`ChatController` sets `userContext.setUserId(userId)` before calling the assistant.
`CookingTools` injects `UserContext` to read it. The AI **never** controls the userId.

---

## 4. Edge Cases

| Case | Handling |
|---|---|
| AI calls `createRecipe` with a duplicate recipe name | Allow duplicates (same as manual creation). Optionally warn in the tool's return string. |
| AI provides an ingredient name that matches multiple Ingredients (case mismatch) | `findByNameIgnoreCase` returns the first match; if no match, insert a new Ingredient. |
| AI calls `addRecipeToMenu` with a `recipeId` that belongs to a different user | `recipeRepository.findByIdAndUserId(id, userId)` — return error string to AI if not found. |
| `createRecipe` with 0 ingredients | Allowed — Recipe entity permits no ingredients. |
| `addItemsToShoppingList` with duplicate item names | Insert as separate rows (consistent with existing bulk-insert behavior). |
| AI token context limit hit with long history | `MessageWindowChatMemory(maxMessages=20)` naturally trims oldest messages. |
| Slow tool execution (DB under load) | No timeout configured by default in LangChain4j OpenAI client. Set `timeout` in `langchain4j.open-ai.chat-model.timeout` (recommended: 30s). |
| User asks to create a recipe while viewing an existing recipe | `recipeContext` in request is still sent; include it in the user message prefix so the AI can reference the current recipe's name/id in its tool call. |
| `addItemsToShoppingList` called with no items | Tool returns early with "No items provided." |
| AI hallucinates a `recipeId` (UUID format invalid) | Wrap `UUID.fromString()` in try/catch inside each tool; return an error string to the AI. |

---

## 5. Security Issues

| Risk | Severity | Mitigation |
|---|---|---|
| **Prompt injection via user message** | High | Keep `FORBIDDEN_PATTERNS` check; run before LangChain4j. Consider adding `\n`, `\\n` and Unicode lookalikes to the pattern list. |
| **userId spoofing via tool parameters** | High | UserId is always read from `UserContext` (JWT-extracted) inside `CookingTools`. The AI never passes userId as a tool argument. |
| **Tool call flood (recipe/shopping list spam)** | Medium | `UsageQuota.ai_message_sent` already exists — increment it in `ChatController` and enforce a per-day limit (e.g., 50 messages for free tier). |
| **Mass data creation via single message** | Medium | Limit `ingredients` and `items` lists to max 30 entries each in `@Tool` parameter validation (`if (items.size() > 30) throw …`). |
| **AI leaking other users' data via `listMyRecipes`** | Low | Query is always scoped to `userId` from `UserContext`. |
| **OpenAI API key in logs** | Low | Spring Boot auto-redacts `*key*` in actuator; verify LangChain4j HTTP logging (disable at `WARN` level in prod). |
| **Prompt leaking system instructions** | Low | LangChain4j does not expose the system message to clients. The raw API response is never returned to the frontend. |

---

## 6. UX Issues

| Issue | Impact | Recommendation |
|---|---|---|
| **No streaming** | High | User waits silently for the full response + tool execution (can be 3–6s). Short-term: keep a "typing…" indicator. Long-term: add SSE streaming (`StreamingChatModel`). |
| **Tool execution is invisible** | Medium | When a tool runs, the AI produces a final confirmation message. The frontend should show the `recipe_created` / `shopping_list_updated` card prominently, not just as text. |
| **Ambiguous tool trigger** | Medium | "Make me a pasta recipe" will trigger `createRecipe` immediately, saving to DB without confirmation. Consider adding an intermediate "AI wants to create a recipe — confirm?" step (requires a 2-turn UX pattern). |
| **No history on first load** | Low | The chat component should call `GET /api/chat/history` on mount to render previous messages. This endpoint doesn't exist yet — add it (returns last 50 `AIMessage` rows). |
| **Created recipe not immediately visible** | Low | After `recipe_created`, the in-memory recipe list in `pantryContext` is stale. The "View Recipe" button should trigger a recipe list refresh. |
| **Mobile: card layout** | Low | `AICookingAssistantScreen` uses FlatList with `Text` bubbles. The new cards need a `View`/`TouchableOpacity` component — existing `ShoppingList` card patterns in the mobile app can be reused. |

---

## 7. Performance Issues

| Issue | Impact | Recommendation |
|---|---|---|
| **Missing DB index on `ai_messages(user_id, created_at)`** | High | Add index: `CREATE INDEX idx_ai_messages_user_created ON ai_messages(user_id, created_at DESC)`. Needed for the "last 20 messages" query on every request. |
| **N+1 ingredient lookups in `createRecipe`** | Medium | Fetch all ingredient names in one query (`findAllByNameInIgnoreCase(names)`), then insert only the missing ones. |
| **N+1 ingredient lookups in `addItemsToShoppingList`** | Medium | Same pattern as above. |
| **In-memory chat memory lost on restart** | Medium | On server restart, the AI has no history. Use the DB-backed memory store (§3.2) or the manual-history approach to avoid regression. |
| **No connection pooling in OpenAI HTTP client** | Low | LangChain4j's OpenAI client uses OkHttp with a default connection pool — this is fine for current load. |
| **`createRecipe` is synchronous in the AI turn** | Low | The AI waits for the DB write before formulating its reply. Acceptable at current scale; consider async tool execution only if DB write times exceed 500ms consistently. |

---

## 8. Files to Create / Modify

### Backend

| File | Action |
|---|---|
| `pom.xml` | Add `langchain4j-open-ai-spring-boot-starter` |
| `application.yml` | Add `langchain4j.open-ai.chat-model.*` block |
| `config/LangChain4jConfig.java` | New – builds `CookingAssistant` bean |
| `service/CookingTools.java` | New – `@Tool` methods (replaces `ChatActionService`) |
| `service/UserContext.java` | New – `@RequestScope` userId holder |
| `service/ToolResultCollector.java` | New – `@RequestScope` result holder |
| `controller/ChatController.java` | Rewrite – use `CookingAssistant`, persist `AIMessage`, map response |
| `service/OpenAIService.java` | Delete (replaced by LangChain4j) |
| `service/ChatActionService.java` | Delete (replaced by `CookingTools`) |
| `repository/AIMessageRepository.java` | Add `findTop20ByUserIdOrderByCreatedAtDesc(UUID)` |
| `dto/ChatSendResponse.java` | No change needed |

### Frontend – Web

| File | Action |
|---|---|
| `components/AICookingAssistant.tsx` | Add `recipe_created` and `shopping_list_updated` message renderers |
| `api/chat.ts` | No change (contract unchanged) |

### Frontend – Mobile

| File | Action |
|---|---|
| `screens/AICookingAssistantScreen.tsx` | Mirror web: add the two new card types |

---

## 9. Out of Scope (for this feature)

- Streaming responses (SSE / `StreamingChatModel`) — follow-up feature
- Session-isolated chat history — requires schema change (`session_id` on `ai_messages`)
- Usage quota enforcement — existing `UsageQuota` entity; wire up in a follow-up
- Subscription gating of AI features — follow-up
- Recipe image generation from AI — follow-up
