# Task 06: Health endpoint

**Phase:** 2 — Auth & health  
**Depends on:** 01, 04  
**Blocks:** 18, 20

## Description

Implement `GET /api/health` matching Spring: **bare** body, not wrapped in `ApiResponse`.

## Files

| Action | Path |
|--------|------|
| Create | `backend-node/src/health/health.module.ts` |
| Create | `backend-node/src/health/health.controller.ts` |
| Modify | `backend-node/src/app.module.ts` |

## Implementation

- Path: `GET /api/health`
- Response: `{ "status": "UP", "timestamp": <unix seconds> }`
- Mark `@Public()`.

## Acceptance criteria

- [ ] Status 200
- [ ] Body has `status` and numeric `timestamp` only (no `success` field)
- [ ] Accessible without JWT

## How to test

```powershell
curl http://localhost:8081/api/health
```
