# Task 04: ApiResponse, exception filter, CORS

**Phase:** 1 — Scaffold & shared infra  
**Depends on:** 01, 02  
**Blocks:** 06–17

## Description

Port Spring `ApiResponse` envelope, global error mapping, and CORS (including Google callback exception).

## Files

| Action | Path |
|--------|------|
| Create | `backend-node/src/common/api-response.ts` |
| Create | `backend-node/src/common/filters/http-exception.filter.ts` |
| Create | `backend-node/src/common/errors/*.ts` (BadRequest, NotFound, Unauthorized helpers) |
| Modify | `backend-node/src/main.ts` |

## Implementation

- `ApiResponse<T>`: `{ success, message, data? }` with helpers `ok` / `fail`.
- Filter maps:
  - 400 / 401 / 404 / 500 → `{ success: false, message }`
  - Optional 402 quota shape for later recipe limit (task 14)
- Omit `data` when undefined (Jackson `NON_NULL` parity).
- CORS: `CORS_ALLOWED_ORIGINS` comma-split; credentials true for SPA.
- Special-case `/api/auth/google-callback`: allow broad origin for POST/OPTIONS (match Spring).
- Enable global `ValidationPipe` (whitelist, transform).

## Acceptance criteria

- [ ] Thrown domain errors serialize as Spring-like `ApiResponse` errors
- [ ] CORS allows configured frontend origins
- [ ] Google callback path has permissive CORS for POST
- [ ] Health (task 06) can opt out of envelope (do not force-wrap all responses)

## How to test

- Temporary test route throwing BadRequest → assert JSON body/status.
- Or cover via later auth/CRUD tests.
