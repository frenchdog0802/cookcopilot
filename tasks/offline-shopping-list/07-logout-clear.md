# Task 07: Logout clears offline data

**Phase:** 2 — Integration  
**Depends on:** 02  
**Blocks:** 10

## Description

Clear shopping list snapshot + queue for the logged-out user.

## Files

| Action | Path |
|--------|------|
| Modify | `mobile/src/contexts/authContext.tsx` |

## Acceptance criteria

- [ ] Logout removes that user’s offline shopping keys
- [ ] No cross-user list leak on next login
