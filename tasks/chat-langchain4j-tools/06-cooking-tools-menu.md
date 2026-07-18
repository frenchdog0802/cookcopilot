# Task 06: CookingTools — menu tools

**Phase:** 1 — Backend foundation  
**Depends on:** 03, 04  
**Blocks:** 09, 10, 12

## Description

Create `CookingTools` with the three existing menu-related `@Tool` methods, delegating to repositories and writing `action_result` data to `ToolResultCollector`.

## Files

| Action | Path |
|--------|------|
| Create | `backend/src/main/java/com/LarderMind/service/CookingTools.java` (partial; extended in 07–08) |

## Implementation

| Tool | Domain | TRC |
|------|--------|-----|
| `listMyRecipes()` | `recipeRepository.findByUserId(userContext.getUserId())` | None (AI-only) |
| `addRecipeToMenu(recipeId, mealType)` | Verify `findByIdAndUserId`; `MealPlanRepository.save` | `addRecipeToMenu` → `action_result` shape |
| `removeRecipeFromMenu(mealPlanId)` | Delete meal plan for user | `removeRecipeFromMenu` → `action_result` shape |

Validation:

- Wrap `UUID.fromString` in try/catch; return error string to AI on invalid UUID
- Reject other user's recipe with error string (no TRC)

## Acceptance criteria

- [ ] `@Component` class with `@Tool`-annotated methods (LangChain4j)
- [ ] All DB access uses `UserContext.getUserId()`, never AI-supplied userId
- [ ] `addRecipeToMenu` succeeds for own recipe; fails for foreign recipe
- [ ] `removeRecipeFromMenu` deletes only user's meal plan
- [ ] `listMyRecipes` returns id + name list scoped to user
- [ ] TRC populated for add/remove with same `data` shape as current `ChatActionService`

## How to test

Unit tests with mocked repos + `UserContext` + `ToolResultCollector`:

1. Happy path add to menu → TRC has `addRecipeToMenu`, meal plan saved.
2. Foreign recipeId → error string, no TRC.
3. Invalid UUID → error string.
4. List returns only current user's recipes.

Compare TRC `data` fields to existing `ChatActionService` output for parity.
