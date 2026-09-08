# Task 12: Folders module

**Phase:** 3 — Core CRUD  
**Depends on:** 03, 04, 05, 08  
**Blocks:** 14

## Description

Port `/api/folder` CRUD matching Spring `FolderController` / `FolderService`.

## Files

| Action | Path |
|--------|------|
| Create | `backend-node/src/folders/*` |

## Implementation

- List/create scoped by `userId` from JWT.
- Get/update/delete by id: **match Spring ownership checks** (parity over hardening).
- Fields: `name`, `color`, `icon`.

## Acceptance criteria

- [ ] Create → list shows folder for that user
- [ ] Update/delete work; responses use `ApiResponse` + Spring DTO names
- [ ] JWT required

## How to test

CRUD curl sequence with Bearer token; optional compare to Spring.
