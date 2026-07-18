# Task 08: CookingTools — addItemsToShoppingList

**Phase:** 1 — Backend foundation  
**Depends on:** 03, 04, 06  
**Blocks:** 09, 10, 12

## Description

Add `addItemsToShoppingList` tool: bulk-insert shopping list items for the current user with batch ingredient resolution.

## Files

| Action | Path |
|--------|------|
| Modify | `backend/src/main/java/com/CookCopilot/service/CookingTools.java` |
| Create (optional) | `ShoppingItemInput` record |

## Implementation

**Parameter record:**

```java
public record ShoppingItemInput(String name, String quantity, String unit) {}
```

**Tool:** `addItemsToShoppingList(List<ShoppingItemInput> items)`

Flow:

1. Empty list → early return `"No items provided."`; no TRC
2. Validate `items.size() <= 30`
3. Batch ingredient lookup/create (same pattern as task 07)
4. Call `ShoppingListService.insertAllShoppingListItems()` (or equivalent bulk API)
5. TRC: `{ itemsAdded, items: [{ name, quantity, unit }] }`

Duplicate names → separate rows (existing bulk behavior).

## Acceptance criteria

- [ ] Items scoped to `UserContext.userId`
- [ ] Empty list returns message without TRC or DB writes
- [ ] TRC populated for `shopping_list_updated` response type
- [ ] >30 items rejected
- [ ] Reuses existing shopping list service (no duplicated persistence logic)

## How to test

Unit tests:

1. 2 items → TRC `itemsAdded = 2`, service called once.
2. Empty list → no TRC, no service call.
3. 31 items → error.
4. Duplicate names → both inserted (verify service args).

Integration test (task 13): rows appear in `shopping_list_items`.
