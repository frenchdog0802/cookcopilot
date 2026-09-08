# Checklist: backend-node-migration

Mark each item when acceptance criteria are met and verified.

## Phase 1 — Scaffold & shared infra

- [x] **01** — NestJS `backend-node/` scaffolds; `dev`/`build`/`lint` scripts work
- [x] **02** — Env schema inherits Spring names; boot fails clearly if required vars missing
- [x] **03** — Prisma schema + client for Wave 1 tables; no migrate on shared DB
- [x] **04** — `ApiResponse` + global filter + CORS (incl. google-callback exception)
- [x] **05** — JWT sign/verify (`user_id`, HS256, no `exp`) + guard + `@Public` / `@CurrentUser`

## Phase 2 — Auth & health

- [x] **06** — `GET /api/health` bare `{ status, timestamp }`
- [x] **07** — HMAC-SHA1 password util + unit tests vs known vectors
- [x] **08** — signup / signin / signout match Spring messages & shapes
- [x] **09** — Google login + callback Base64URL hash flow

## Phase 3 — Core CRUD

- [x] **10** — `/api/users` list/get/update/delete (full Spring parity)
- [x] **11** — `/api/user-preferences` get/put for current user
- [x] **12** — `/api/folder` CRUD
- [x] **13** — `/api/ingredient` CRUD + bulk
- [x] **14** — `/api/recipe` CRUD (+ thin free-tier max-recipes check)
- [x] **15** — `/api/pantry-item` CRUD + bulk
- [x] **16** — `/api/shopping-list` CRUD + bulk
- [x] **17** — `/api/meal-plan` CRUD only (no confirm/skip)

## Phase 4 — Verify & docs

- [x] **18** — Integration smoke: health + auth + one CRUD round-trip (CRUD skips when Postgres unavailable)
- [x] **19** — `backend-node/README.md` + root/docs parallel-run notes
- [x] **20** — Wave 1 regression / client env flip QA

## Manual QA (task 20)

- [x] Health endpoint verified live on `:8090`
- [x] Lint / build / unit / e2e gates green
- [ ] Signup / signin against Node *(needs Postgres — Docker Desktop was down during Wave 1 closeout)*
- [ ] Google login (if configured)
- [ ] Recipes list/create/update/delete *(needs Postgres)*
- [ ] Pantry + shopping list round-trip *(needs Postgres)*
- [ ] Meal plan create/list/delete (confirm/skip still on Spring) *(needs Postgres)*
- [ ] Same DB rows visible from Spring after Node writes *(needs Postgres)*
