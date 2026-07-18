# Task 18: Web App.tsx navigation for View Recipe

**Phase:** 2 — Frontend  
**Depends on:** 16  
**Blocks:** 23

## Description

Enable "View Recipe" on the `recipe_created` card to deep-link into Recipe Manager with the new recipe pre-selected.

## Files

| Action | Path |
|--------|------|
| Modify | `frontend/client/src/App.tsx` |
| Modify | `frontend/client/src/components/AICookingAssistant.tsx` |

## Implementation

- Add optional `selectedRecipeId` state (or context) in `App.tsx`
- Pass setter/callback to `AICookingAssistant`
- On View Recipe: `setSelectedRecipeId(recipeId)` + `setCurrentView('recipeManager')`
- Recipe Manager reads `selectedRecipeId` to highlight/open recipe
- Refresh recipe list in `pantryContext` on navigation so list is not stale

## Acceptance criteria

- [ ] View Recipe opens Recipe Manager with correct recipe selected/visible
- [ ] Recipe list refreshed before or on navigation
- [ ] Works for AI-created recipe immediately after card appears
- [ ] No regression to other navigation paths

## How to test

1. Create recipe via chat → View Recipe → correct recipe detail/list selection.
2. Navigate away and back → recipe still in list.
3. Manual: verify recipe CRUD flows unchanged.
