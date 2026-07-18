# Task 16: Web recipe_created card

**Phase:** 2 — Frontend  
**Depends on:** 14  
**Blocks:** 18, 23

## Description

Render a structured card when `response.type === 'recipe_created'`, below the assistant text bubble.

## Files

| Action | Path |
|--------|------|
| Modify | `frontend/client/src/components/AICookingAssistant.tsx` |

## UI spec

```
🍳 {recipeName}
{ingredientCount} ingredients · {steps.length} steps
[View Recipe]  [Add to Menu]
```

**Data fields:** `recipeId`, `recipeName`, `ingredientCount`, `steps` (array)

**Add to Menu:** `POST /api/meal-plan` with `{ recipeId, mealType: "dinner" }` via existing `mealPlanApi`.

**View Recipe:** wired in task 18 (placeholder handler OK until then).

## Acceptance criteria

- [ ] Card renders when `type === 'recipe_created'`
- [ ] Shows name, ingredient count, step count from `response.data`
- [ ] "Add to Menu" calls meal-plan API and shows success/error feedback
- [ ] Assistant text bubble still shows `response.message`
- [ ] Removed handling for old `type === 'recipe'` suggestion cards

## How to test

1. Mock `ChatResponse` with `recipe_created` → card visible in Storybook or component test.
2. E2E: ask AI to create recipe (with backend running) → card appears.
3. Click Add to Menu → meal appears on calendar (manual).
