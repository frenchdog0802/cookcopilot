# Task 02: Config – inherit Spring env properties

**Phase:** 1 — Scaffold & shared infra  
**Depends on:** 01  
**Blocks:** 03, 05, 08, 09, 14

## Description

Load and validate the same environment variable names as Spring `backend/.env.example` / `application.yml`. Fail fast on missing required Wave 1 vars.

## Files

| Action | Path |
|--------|------|
| Create | `backend-node/src/config/env.schema.ts` (or equivalent Zod/Joi) |
| Create | `backend-node/src/config/config.module.ts` |
| Create | `backend-node/.env.example` |
| Modify | `backend-node/src/app.module.ts` |
| Modify | `backend-node/src/main.ts` (use `PORT`) |

## Implementation

- Required Wave 1: `DB_*`, `JWT_SECRET`, `GOOGLE_CLIENT_ID` (may be empty string), `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`, `PORT` (default **8090** — Expo often owns 8081).
- Optional: LLM, Stripe, Cloudinary, Unsplash, pool sizes — declare in `.env.example`, not required to boot unless used.
- Copy names exactly from `backend/.env.example`; do not rename.
- Document Node-only extras (`NODE_ENV`) separately.
- Include thin subscription free/pro numeric defaults from `application.yml` for later recipe limit (task 14).

## Acceptance criteria

- [x] Boot with valid `.env` succeeds
- [x] Boot without `JWT_SECRET` (or other required) exits with readable error
- [x] `.env.example` lists Spring-compatible names + `PORT=8090` note
- [x] `PORT` default is 8090 when unset

## How to test

```powershell
cd backend-node
# copy .env.example → .env, omit JWT_SECRET → expect fail
# restore JWT_SECRET → expect boot
```
