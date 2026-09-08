# Task 10: Users module

**Phase:** 3 — Core CRUD  
**Depends on:** 03, 04, 05, 08  
**Blocks:** 18

## Description

Port `/api/users` with **full Spring parity** (any authenticated user can list/get/update/delete any user — no self-only restriction).

## Files

| Action | Path |
|--------|------|
| Create | `backend-node/src/users/users.module.ts` |
| Create | `backend-node/src/users/users.controller.ts` |
| Create | `backend-node/src/users/users.service.ts` |
| Create | `backend-node/src/users/dto/*.ts` |

## Implementation

| Method | Path |
|--------|------|
| GET | `/api/users` |
| GET | `/api/users/:id` |
| PUT | `/api/users/:id` |
| DELETE | `/api/users/:id` |

- JWT required.
- Response envelopes match Spring `ListUsersResponse`, `ReadUserResponse`, etc.
- Not found → 404 `"User not found"`.

## Acceptance criteria

- [ ] Authenticated list returns users
- [ ] Update/delete by id work
- [ ] Unauthenticated → 401
- [ ] DTO field names match Spring wire JSON

## How to test

Use token from signup; curl each verb; compare shape to Spring `:8080` if both running.
