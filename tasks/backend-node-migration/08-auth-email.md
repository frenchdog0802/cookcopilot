# Task 08: Auth signup / signin / signout

**Phase:** 2 — Auth & health  
**Depends on:** 03, 04, 05, 07  
**Blocks:** 09, 10–17, 18

## Description

Implement email/password auth endpoints with Spring message and DTO parity.

## Files

| Action | Path |
|--------|------|
| Create | `backend-node/src/auth/auth.module.ts` |
| Create | `backend-node/src/auth/auth.controller.ts` |
| Create | `backend-node/src/auth/auth.service.ts` |
| Create | `backend-node/src/auth/dto/*.ts` |
| Modify | `backend-node/src/app.module.ts` |

## Implementation

| Method | Path | Behavior |
|--------|------|----------|
| POST | `/api/auth/signup` | Reject duplicate email `"Email is taken"`; create user; return `{ token, user }` |
| POST | `/api/auth/signin` | `"User not found"` / `"Email and password don't match."`; return `{ token, user }` |
| GET | `/api/auth/signout` | Success with Spring `SignoutResponse` shape |

- Request snake_case: `first_name`, `last_name`.
- Set `name` = first + last; `role` = `user`.
- All `@Public()`.
- Wrap in `ApiResponse`.

## Acceptance criteria

- [ ] Signup then signin returns JWT usable by guard (task 05)
- [ ] Duplicate signup → 400 `"Email is taken"`
- [ ] Wrong password → 400 with Spring message
- [ ] User JSON fields match Spring `UserDto` wire shape

## How to test

```powershell
curl -X POST http://localhost:8081/api/auth/signup -H "Content-Type: application/json" -d "{...}"
curl -X POST http://localhost:8081/api/auth/signin -H "Content-Type: application/json" -d "{...}"
```
