# Task 05: JWT service + Auth guard

**Phase:** 1 — Scaffold & shared infra  
**Depends on:** 02, 04  
**Blocks:** 08–17

## Description

Implement JWT issue/verify compatible with Spring `JwtUtil` / `JwtAuthenticationFilter`, plus Nest guard and user decorator.

## Files

| Action | Path |
|--------|------|
| Create | `backend-node/src/auth/jwt.service.ts` (or `common/jwt`) |
| Create | `backend-node/src/auth/guards/jwt-auth.guard.ts` |
| Create | `backend-node/src/auth/decorators/public.decorator.ts` |
| Create | `backend-node/src/auth/decorators/current-user.decorator.ts` |
| Modify | `backend-node/src/app.module.ts` (global guard optional) |

## Implementation

- Secret: `JWT_SECRET` UTF-8 bytes, **HS256**.
- Claims: **`user_id`** (UUID string), **`iat`**, **no `exp`**.
- Header: `Authorization: Bearer <token>`.
- Invalid/missing token on protected routes → 401 `ApiResponse`.
- `@Public()` skips guard for auth/health.
- `@CurrentUser()` returns user id string (UUID).

## Acceptance criteria

- [ ] Token signed by Nest verifies with same secret logic (unit test)
- [ ] Prefer: token from Spring (if available) verifies on Nest, or Nest token structure matches Spring claims
- [ ] Protected route without token → 401
- [ ] `@Public()` routes remain accessible

## How to test

```powershell
cd backend-node
npm test -- jwt
```

Decode a generated token and assert payload has `user_id` and no `exp`.
