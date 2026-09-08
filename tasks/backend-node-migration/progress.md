# Progress: backend-node-migration

**Last updated:** 2026-08-15  
**Overall:** 20 / 20 tasks complete (100%)

## Phase summary

| Phase | Complete | Total | Status |
|-------|----------|-------|--------|
| 1 — Scaffold & shared infra | 5 | 5 | Complete |
| 2 — Auth & health | 4 | 4 | Complete |
| 3 — Core CRUD | 8 | 8 | Complete |
| 4 — Verify & docs | 3 | 3 | Complete |

## Current focus

**Wave 1 coding complete.** Next (new task folder when ready): Wave **1.5** meal-plan confirm/skip; Wave **2** chat/LangChain.js, upload, subscription.

## Completed tasks

- **01–05** — Nest scaffold, Spring env inheritance, Prisma client (no migrate), ApiResponse/CORS, JWT guard
- **06–09** — Health, HMAC-SHA1 passwords, email auth, Google login/callback
- **10–17** — Users, preferences, folders, ingredients, recipes, pantry, shopping, meal-plan CRUD
- **18–20** — E2E smoke (health always; CRUD when DB up), README/root/docs/compose notes, QA closeout

## Blockers

_None for Wave 1 deliverable._ Local Docker Desktop was unavailable during closeout, so full client/DB manual QA items remain unchecked in `checklist.md` — re-run when Postgres is up:

```powershell
docker compose up db -d
cd backend-node
npm run test:e2e
npm run dev
# VITE_API_BASE_URL=http://localhost:8090
```

## Notes

- Default Nest port **8090** (Expo **8081**, Spring **8080**).
- Password: HMAC-SHA1 + salt hex. JWT: HS256 + `user_id` + `iat`, no `exp`.
- Prisma: generate only — no migrate/push on shared DB while Hibernate owns DDL.
- Meal confirm/skip, chat, upload, subscription deferred.

## Success criteria (from design Wave 1)

- [x] `backend-node/` runs with Spring-compatible env (`PORT=8090` default)
- [x] Health + auth (email + Google) implemented; JWT authorizes CRUD
- [x] Core CRUD modules: users, preferences, folders, recipes, ingredients, pantry, shopping, meal-plan CRUD
- [x] Client switch documented via `VITE_API_BASE_URL` / `EXPO_PUBLIC_API_BASE_URL`
- [x] Lint, typecheck (`build`), and tests pass
