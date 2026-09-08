# Task 09: Google login + callback

**Phase:** 2 — Auth & health  
**Depends on:** 08  
**Blocks:** 20

## Description

Port Google ID token login and GIS redirect callback from Spring `AuthController` / `AuthService`.

## Files

| Action | Path |
|--------|------|
| Modify | `backend-node/src/auth/auth.controller.ts` |
| Modify | `backend-node/src/auth/auth.service.ts` |
| Create | `backend-node/src/auth/dto/google-login.dto.ts` |

## Implementation

- `POST /api/auth/google-login` body `{ token }` — verify with `GOOGLE_CLIENT_ID` audience; require verified email; find/link/create user (same order as Spring).
- Reject non-JWT (not exactly two `.`).
- `POST /api/auth/google-callback` form field `credential` → 302 to `FRONTEND_URL/#google_auth=<base64url json>` or `#google_auth_error=`.
- Escape non-ASCII in JSON payload like Spring when practical.
- Missing `GOOGLE_CLIENT_ID` → `"Google login is not configured on the server"`.

## Acceptance criteria

- [ ] Invalid token → 400 with clear message
- [ ] Valid token path creates or links user and returns JWT (manual or mocked verifier test)
- [ ] Callback redirects with hash payload shape clients expect
- [ ] CORS exception from task 04 applies to callback

## How to test

- Unit-test verifier mocked; manual GIS flow against local frontend if credentials configured.
