# Task 18: Integration smoke tests

**Phase:** 4 — Verify & docs  
**Depends on:** 06, 08, 12 (min); ideally 14–17  
**Blocks:** 20

## Description

Automated smoke covering health + auth + at least one authenticated CRUD round-trip against a test/local DB.

## Files

| Action | Path |
|--------|------|
| Create | `backend-node/test/*.e2e-spec.ts` or `src/**/*.e2e-spec.ts` |
| Create | `backend-node/.env.test` or test config (no secrets committed) |

## Implementation

Minimum flow:

1. `GET /api/health` → bare UP
2. `POST /api/auth/signup` (unique email)
3. `POST /api/auth/signin`
4. `POST /api/folder` with Bearer → `GET /api/folder`

Prefer additional recipe create if task 14 done. Use local Docker Postgres or ephemeral DB; do not target production.

## Acceptance criteria

- [ ] `npm test` or `npm run test:e2e` passes in CI/local with documented env
- [ ] Failures assert status + `success`/`message` where applicable
- [ ] No hardcoded production secrets

## How to test

```powershell
cd backend-node
npm run test:e2e
```
