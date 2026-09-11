# Task 05: Pantry FlashList + un-nest

**Phase:** 2 — Lists  
**Depends on:** 02, 03  
**Blocks:** 10

## Description

Remove ScrollView + nested FlatList; use FlashList with `ListHeaderComponent` for search/forms; memo pantry row.

## Files

| Action | Path |
|--------|------|
| Add | `mobile/src/components/pantry/PantryItemRow.tsx` |
| Modify | `mobile/src/screens/PantryInventoryScreen.tsx` |

## Acceptance criteria

- [ ] No `scrollEnabled={false}` FlatList inside ScrollView
- [ ] FlashList is scroll owner
- [ ] Memoized row + estimated size
