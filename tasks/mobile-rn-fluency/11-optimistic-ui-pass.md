# Task 11: Optimistic UI pass

**Phase:** 4 — Perceived  
**Depends on:** 04, 05  
**Blocks:** 13

## Description

Verify shopping check/qty and pantry updates remain local-first; ensure UI does not block on await before visual change where context already updates optimistically. Document rollback path if missing for a toggle.

## Files

| Action | Path |
|--------|------|
| Modify | `mobile/src/screens/ShoppingListScreen.tsx` (if needed) |
| Modify | `mobile/src/contexts/pantryContext.tsx` (only if rollback gap) |
| Modify | Pantry screen handlers if needed |

## Acceptance criteria

- [ ] Check toggle feels instant
- [ ] Hard failure rolls back or surfaces error without stuck state
