# Task 04: Connectivity + flush sync

**Phase:** 1 — Foundation  
**Depends on:** 01, 02, 03  
**Blocks:** 06

## Description

NetInfo wrapper + single-flight queue flush with backoff and final GET reconcile.

## Files

| Action | Path |
|--------|------|
| Add | `mobile/src/services/shoppingListOffline/connectivity.ts` |
| Add | `mobile/src/services/shoppingListOffline/sync.ts` |

## Acceptance criteria

- [ ] Debounced online → flush
- [ ] Mutex prevents concurrent flush
- [ ] CREATE remaps `local_*` ids
- [ ] Network error keeps head op; 404 on update/delete drops op
