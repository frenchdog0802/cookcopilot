# Task 01: Scaffold NestJS `backend-node/`

**Phase:** 1 — Scaffold & shared infra  
**Depends on:** None  
**Blocks:** 02–20

## Description

Create a new NestJS TypeScript application in `backend-node/` beside Spring `backend/`. Do not modify Spring sources.

## Files

| Action | Path |
|--------|------|
| Create | `backend-node/package.json` |
| Create | `backend-node/tsconfig.json` (+ nest/build configs as needed) |
| Create | `backend-node/src/main.ts` |
| Create | `backend-node/src/app.module.ts` |
| Create | `backend-node/nest-cli.json` |
| Create | `backend-node/.gitignore` |
| Create | `backend-node/README.md` (stub OK; full docs in task 19) |

## Implementation

- Use NestJS (npm) with TypeScript **strict**.
- Scripts: `dev` (watch), `build`, `start`, `lint`, `test`.
- Default listen port from env later; for now hardcode fallback **8081** in `main.ts` if `PORT` unset.
- Empty `AppModule` is fine; no domain modules yet.
- Add `backend-node/` to root awareness only if needed (do not remove Spring).

## Acceptance criteria

- [x] `cd backend-node && npm install && npm run build` succeeds
- [x] `npm run start` (or `dev`) boots without DB yet (or with placeholder module)
- [x] No changes under `backend/src` required for this task
- [x] No `any` in committed app code; lint script exists

## How to test

```powershell
cd backend-node
npm install
npm run build
npm run lint
```
