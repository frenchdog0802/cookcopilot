# Task 07: CookingTools — createRecipe

**Phase:** 1 — Backend foundation  
**Depends on:** 03, 04, 06  
**Blocks:** 09, 10, 12

## Description

Add the `createRecipe` tool to `CookingTools`. Creates `Recipe` + `RecipeIngredient` rows, resolves ingredients in batch, and writes `recipe_created` payload to `ToolResultCollector`.

## Files

| Action | Path |
|--------|------|
| Modify | `backend/src/main/java/com/LarderMind/service/CookingTools.java` |
| Create (optional) | `IngredientInput` record in same file or `dto/` package |

## Implementation

**Parameter record:**

```java
public record IngredientInput(String name, String quantity, String unit, String note) {}
```

**Tool signature:** `createRecipe(String name, String description, List<IngredientInput> ingredients, List<String> steps)`

Flow:

1. Validate `ingredients.size() <= 30` (else `IllegalArgumentException` → error string)
2. Batch lookup via `findAllByNameInIgnoreCase`; create missing `Ingredient` rows
3. Save `Recipe` with `UserContext.userId`, `folderId = null`
4. Save `RecipeIngredient` per input
5. TRC: `{ recipeId, recipeName, ingredientCount, steps }`

0 ingredients allowed. Duplicate recipe names allowed.

## Acceptance criteria

- [ ] Recipe persisted with correct userId and steps
- [ ] Ingredients matched case-insensitively; new names create new rows
- [ ] TRC set with tool name `createRecipe` and fields for `recipe_created` response
- [ ] >30 ingredients rejected with error string to AI
- [ ] Tool does not call controller or construct HTTP responses

## How to test

Unit tests:

1. Happy path with 3 ingredients → recipe + 3 recipe_ingredients in mocks.
2. Zero ingredients → recipe saved, ingredientCount = 0.
3. 31 ingredients → exception/error string, no recipe saved.
4. Mixed-case ingredient name matches existing row.

Integration test (task 13): tool invoked via mocked model → row in `recipes` table.
