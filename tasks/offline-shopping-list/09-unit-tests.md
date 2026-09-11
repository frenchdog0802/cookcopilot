# Task 09: Unit tests

**Phase:** 4 — Verify  
**Depends on:** 03, 04, 05  
**Blocks:** 10

## Description

Jest coverage for coalesce, remap, mergeNames, dual payload, store round-trip.

## Files

| Action | Path |
|--------|------|
| Add | `mobile/src/__tests__/shoppingListOffline/*.test.ts` |
| Modify | `mobile/jest.setup.js` (NetInfo mock if needed) |

## Acceptance criteria

- [ ] New tests pass via `npm test -- --testPathPattern=shoppingListOffline`
- [ ] Dual payload assertion covered
