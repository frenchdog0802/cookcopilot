# Task 06: pantryContext local-first shopping

**Phase:** 2 — Integration  
**Depends on:** 02, 03, 04, 05  
**Blocks:** 08

## Description

Hydrate from snapshot, local-first mutations, expose `shoppingListSyncStatus`, auto flush.

## Files

| Action | Path |
|--------|------|
| Modify | `mobile/src/contexts/pantryContext.tsx` |
| Modify | `mobile/src/types.ts` (optional sync status type) |

## Acceptance criteria

- [ ] Offline mutations update UI + persist
- [ ] Online fetch merges names and replaces snapshot
- [ ] Sync status fields available to UI
- [ ] Needs authenticated userId for store keys
