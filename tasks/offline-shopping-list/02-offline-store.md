# Task 02: Offline types + store

**Phase:** 1 — Foundation  
**Depends on:** None  
**Blocks:** 03, 04, 06, 07

## Description

Add versioned AsyncStorage snapshot + queue I/O keyed by userId.

## Files

| Action | Path |
|--------|------|
| Add | `mobile/src/services/shoppingListOffline/types.ts` |
| Add | `mobile/src/services/shoppingListOffline/store.ts` |
| Add | `mobile/src/services/shoppingListOffline/index.ts` |

## Acceptance criteria

- [ ] Keys: `@lardermind/shopping-list/v1/{userId}/snapshot|queue`
- [ ] load/save snapshot + queue; `clearUserOfflineData`
- [ ] Invalid/missing JSON returns empty safely
