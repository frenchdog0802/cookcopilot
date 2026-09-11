# Task 04: ShoppingList FlashList + memo row

**Phase:** 2 — Lists  
**Depends on:** 02, 03  
**Blocks:** 08, 09, 10

## Description

Replace Shopping `FlatList` with FlashList; extract `ShoppingListRow` with `React.memo`; set `estimatedItemSize`.

## Files

| Action | Path |
|--------|------|
| Add | `mobile/src/components/shopping/ShoppingListRow.tsx` |
| Modify | `mobile/src/screens/ShoppingListScreen.tsx` |

## Acceptance criteria

- [ ] No FlatList for main shopping items
- [ ] Row memoized; `ESTIMATED_SHOPPING_ROW` used
- [ ] Empty state preserved
