# Task 22: Update GET /api/chat/actions

**Phase:** 3 — Cleanup & verification  
**Depends on:** 21  
**Blocks:** None

## Description

Keep the existing actions discovery endpoint but update the listed tool/action names to match LangChain4j `@Tool` methods.

## Files

| Action | Path |
|--------|------|
| Modify | `backend/src/main/java/com/LarderMind/controller/ChatController.java` |

## Implementation

Update action list to reflect five tools:

- `listMyRecipes`
- `addRecipeToMenu`
- `removeRecipeFromMenu`
- `createRecipe`
- `addItemsToShoppingList`

Maintain backward-compatible response shape if clients depend on it; deprecate old snake_case names in comment if needed.

## Acceptance criteria

- [ ] `GET /api/chat/actions` returns 200 with updated tool names
- [ ] Endpoint remains JWT-protected
- [ ] No breaking change to response structure (array/list format preserved)
- [ ] Documented as informational (AI chooses tools automatically)

## How to test

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/chat/actions
```

Assert response includes all five tool names.
