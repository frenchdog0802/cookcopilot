# Task 15: Pantry items module + bulk

**Phase:** 3 — Core CRUD  
**Depends on:** 13  
**Blocks:** 16, 20

## Description

Port `/api/pantry-item` CRUD plus `POST /bulk` and `PUT /bulk`.

## Files

| Action | Path |
|--------|------|
| Create | `backend-node/src/pantry-items/*` |

## Implementation

- Scope by JWT `userId`.
- Resolve ingredients / quantities / units consistent with Spring `PantryItemService` (reuse unit helpers from task 14 if extracted).
- Bulk endpoints match Spring request/response DTOs.

## Acceptance criteria

- [ ] CRUD works for current user
- [ ] Bulk insert and bulk update succeed
- [ ] JWT required; responses match Spring shapes

## How to test

Create pantry item; bulk update quantities; list verify.
