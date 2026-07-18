# Task 20: Mobile history and response cards

**Phase:** 2 — Frontend  
**Depends on:** 19, 11  
**Blocks:** 23

## Description

Add history hydration on mount and render `recipe_created` / `shopping_list_updated` cards in `AICookingAssistantScreen`, mirroring web behavior.

## Files

| Action | Path |
|--------|------|
| Modify | `mobile/src/screens/AICookingAssistantScreen.tsx` |

## Implementation

**Mount:** call `getHistory()`; map to FlatList messages or keep welcome if empty.

**recipe_created card:**

- Reuse styling patterns from existing recipe suggestion block
- View Recipe → `navigation.navigate('RecipeManager', { recipeId })` (verify stack params)
- Add to Menu → existing meal-plan API

**shopping_list_updated card:**

- Chips + "View Shopping List" → `navigation.navigate('ShoppingList')`
- Refresh shopping list via `pantryContext`

## Acceptance criteria

- [ ] History loads on screen mount (same rules as web task 15)
- [ ] Both new card types render in `renderMessage` (or equivalent)
- [ ] Navigation targets work on iOS/Android simulator
- [ ] `action_result` and `text` behavior unchanged
- [ ] Error type shows readable message

## How to test

1. Send messages; kill and reopen app → history visible.
2. Trigger recipe creation → card + View Recipe navigation.
3. Trigger shopping list tool → View Shopping List navigation.
4. Verify navigator accepts `recipeId` param (add if missing).
