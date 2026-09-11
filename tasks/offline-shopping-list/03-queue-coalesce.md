# Task 03: Queue coalesce + remap

**Phase:** 1 — Foundation  
**Depends on:** 02  
**Blocks:** 04, 09

## Description

Pure functions for enqueue coalesce rules and temp-id remap per design §4.3–4.4.

## Files

| Action | Path |
|--------|------|
| Add | `mobile/src/services/shoppingListOffline/queue.ts` |
| Add | `mobile/src/services/shoppingListOffline/mergeNames.ts` |

## Acceptance criteria

- [ ] CREATE+DELETE same id → drop both
- [ ] Multiple UPDATE → last wins
- [ ] UPDATE folds into pending CREATE
- [ ] `remapItemId` rewrites queue itemIds
- [ ] `mergeNames` fills missing server names from previous cache
