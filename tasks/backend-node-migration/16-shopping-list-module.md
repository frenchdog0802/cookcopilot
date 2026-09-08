# Task 16: Shopping list module + bulk

**Phase:** 3 — Core CRUD  
**Depends on:** 13, 15  
**Blocks:** 20

## Description

Port `/api/shopping-list` CRUD + `POST /bulk`, including Spring side effect of ensuring a pantry row exists when adding items.

## Files

| Action | Path |
|--------|------|
| Create | `backend-node/src/shopping-list/*` |

## Implementation

- Mirror `ShoppingListService` create/bulk merge-by-name behavior where applicable.
- On create: resolve ingredient, unit conversion, ensure pantry row (qty 0 if missing) — per design §6.5.
- Check-item → pantry sync flags: match Spring update semantics when client toggles checked.

## Acceptance criteria

- [ ] CRUD + bulk work
- [ ] Creating shopping item creates/links pantry row as Spring does
- [ ] Response DTOs match Spring wire shape

## How to test

Add item → verify shopping list + pantry; toggle checked if Spring does pantry add; compare to Spring if needed.
