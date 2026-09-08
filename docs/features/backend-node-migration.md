# Feature: Backend Migration – Spring Boot → NestJS (Node + TypeScript)

**Status:** Planning  
**Scope:** New `backend-node/` (NestJS + Prisma + LangChain.js) running **in parallel** with existing `backend/` (Spring Boot). Wave 1 = auth + health + core CRUD; Wave 2 = chat / subscription / upload.  
**Out of scope (Wave 1):** Chat/AI tools, Stripe/subscription, Cloudinary upload, recipe import (YouTube/Instagram/social), meal-plan **confirm/skip** (proposed **Wave 1.5** — see §9.3), deleting or rewriting Spring `backend/`.

---

## 1. Summary

Introduce a **Node.js + TypeScript** backend beside the current Spring Boot API so we can migrate domain by domain without breaking web/mobile clients.

### Decisions (locked)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Folder | `backend-node/` | Clear parallel to `backend/`; TypeScript is default |
| Framework | **NestJS** | Closest to Spring (modules, DI, guards, DTOs) |
| ORM | **Prisma** | Fits existing Postgres + Supabase pooler; fewer migration pitfalls than TypeORM |
| AI (Wave 2) | **LangChain.js** | Aligns with LangChain4j tools model |
| Scope Wave 1 | Auth + health + core CRUD | Avoid boiling the ocean |
| Cutover | **Parallel ports**; clients switch via env | Spring remains fallback until Node is stable |
| Contract | Keep **`ApiResponse` / DTO shapes** | Clients need near-zero changes |

### What changes

| Area | Before | After (Wave 1) |
|------|--------|----------------|
| API runtime | Spring Boot on `:8080` only | Spring `:8080` + NestJS `:8081` (default; configurable) |
| Config | `backend/application.yml` + `.env` | Same env var names in `backend-node/.env` |
| DB | JPA/Hibernate `ddl-auto: update` | Prisma against **same** PostgreSQL schema (no destructive migrations in Wave 1) |
| Clients | Point at Spring | Optional env flip (`VITE_API_BASE_URL` / `EXPO_PUBLIC_API_BASE_URL`) to Node |

---

## 2. Requirements

### 2.1 Project scaffold (`backend-node/`)

- NestJS app (TypeScript strict), package manager consistent with repo preference (`npm` unless otherwise specified).
- Structure mirrors Spring layers where practical:
  - `modules/` per domain (auth, health, recipe, folder, …)
  - `common/` for `ApiResponse`, filters, pipes
  - `prisma/` for schema + client
- Scripts: `dev`, `build`, `start`, `test`, `lint`, `prisma:generate`, `prisma:pull` (introspect existing DB).
- README: how to run on alternate port, env copy from Spring `.env.example`, how to point frontend/mobile at it.
- **Do not** remove or modify Spring `backend/` beyond optional docker-compose comments documenting the Node service.

### 2.2 Inherit Spring backend properties

Port the **same environment variable contract** as `backend/.env.example` and `application.yml` `app.*` keys. Wave 1 must load and validate at least:

| Category | Env / config | Wave 1 use |
|----------|--------------|------------|
| Server | `PORT` (default **8081** for Node to avoid clash with Spring 8080) | Listen |
| Database | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, `DB_SSL_MODE`, `DB_POOL_SIZE`, `DB_POOL_MIN_IDLE` | Prisma datasource + pool |
| JWT | `JWT_SECRET` | Sign/verify tokens **compatible** with Spring JJWT (same secret, algorithm, claims) |
| Google OAuth | `GOOGLE_CLIENT_ID` | Verify Google ID tokens |
| Frontend / CORS | `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS` | Redirects + CORS (incl. special case for `/api/auth/google-callback`) |
| LLM / Stripe / Cloudinary / Unsplash / YouTube / Social import / subscription quotas | Present in `.env.example` | **Declare & document**; not required to wire until Wave 2 |

Rules:
- Prefer **identical env names** so one secrets set can drive either backend.
- Document any Node-only extras (e.g. `NODE_ENV`) separately; do not rename Spring vars.
- UTF-8 request/response encoding must match Spring behavior (no mojibake on non-ASCII names).

### 2.3 API contract compatibility

Envelope (all JSON success/error paths unless noted):

```json
{
  "success": true,
  "message": "OK",
  "data": { }
}
```

- Error: `{ "success": false, "message": "<reason>" }` (omit `data` or null — match Spring `NON_NULL` omission).
- **Exception:** `GET /api/health` returns bare `HealthResponse` `{ "status": "UP", "timestamp": <unix seconds> }` — **not** wrapped in `ApiResponse` (Spring today).
- Field names, nesting, and HTTP status codes must match existing Spring controllers for Wave 1 routes.
- JWT: `Authorization: Bearer <token>`; payload must be accepted by existing clients (and ideally interchangeable with tokens issued by Spring during parallel run).

### 2.4 Wave 1 endpoints (in scope)

Public (no JWT):

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/health` | Bare health DTO |
| POST | `/api/auth/signup` | |
| POST | `/api/auth/signin` | |
| GET | `/api/auth/signout` | Stateless OK message |
| POST | `/api/auth/google-login` | Body with Google credential/token |
| POST | `/api/auth/google-callback` | Form credential → redirect to `FRONTEND_URL/#google_auth=...` |

JWT-protected core CRUD (parity with Spring controllers):

| Resource | Base path | Operations |
|----------|-----------|------------|
| Users | `/api/users` | list, get, update, delete |
| User preferences | `/api/user-preferences` | get, put |
| Folders | `/api/folder` | CRUD |
| Recipes | `/api/recipe` | CRUD |
| Ingredients | `/api/ingredient` | CRUD + bulk insert |
| Pantry items | `/api/pantry-item` | CRUD + bulk insert/update |
| Shopping list | `/api/shopping-list` | CRUD + bulk insert |
| Meal plans | `/api/meal-plan` | CRUD in Wave 1; **confirm / skip / pending-confirm** proposed for **Wave 1.5** (§9.3) |

OpenAPI/Swagger for Wave 1 routes is desirable but not a hard gate (Spring exposes springdoc; Nest can add `@nestjs/swagger` later).

### 2.5 Wave 2 (explicitly deferred)

- `/api/chat/*` (send, stream, history, actions) + LangChain.js tools
- `/api/upload/*` (Cloudinary)
- `/api/subscription/*` + Stripe webhook
- Recipe import pipelines (YouTube, Instagram, social kit, stock images)
- Meal-plan scheduler / inventory audit extras not needed for basic CRUD
- Docker Compose / Railway cutover replacing Spring as primary

### 2.6 Data layer (Prisma)

- Introspect or hand-map Prisma models to existing tables (`users`, `recipes`, `folders`, …) from Spring entities / `schema.sql`.
- Wave 1: **no** Prisma migrations that drop/alter production columns; prefer `db pull` + client-only until schema ownership moves to Node.
- Respect Supabase pooler constraints: transaction mode (port 6543), SSL when required, small pool sizes (`DB_POOL_SIZE`).
- User scoping: all user-owned resources must filter by authenticated user id (same as Spring services).

### 2.7 Parallel run & client switch

- Default Node port **8081** when Spring uses 8080.
- Document:
  - Web: `VITE_API_BASE_URL=http://localhost:8081`
  - Mobile: `EXPO_PUBLIC_API_BASE_URL=http://localhost:8081/api/` (keep existing suffix convention)
- Spring remains the default in README / docker-compose until cutover checklist is green.

### 2.8 Testing & quality gates

- Unit tests for auth (password hash verify, JWT issue/parse) and at least one CRUD module.
- E2E or integration smoke: health + signup/signin + one authenticated CRUD round-trip against a test DB.
- Lint + typecheck must pass.
- No `any` in production TS; no hardcoded secrets.

---

## 3. Edge cases

| Case | Expected behavior |
|------|-------------------|
| Duplicate signup email | Fail with clear message; same status style as Spring |
| Invalid / expired JWT | 401; consistent with Spring filter |
| Google token invalid / wrong `GOOGLE_CLIENT_ID` | Login fails; callback redirects `#google_auth_error=` |
| Google callback CORS | Allow Google origin pattern for that route only (Spring special-case) |
| Non-ASCII user names in Google callback | Escape / Base64 URL payload so SPA decode stays correct |
| Missing env (e.g. `JWT_SECRET`, DB) | Fail fast at boot with readable error |
| Resource not owned by caller | 404 or forbidden — match Spring service behavior |
| Bulk endpoints empty arrays | Validate; do not crash |
| Parallel Spring + Node writing same DB | Acceptable in Wave 1 for personal/dev use; document race risk (no distributed locking) |

---

## 4. Security issues

- Stateless JWT; secret never committed; rotate independently of framework.
- Password hashing must remain **compatible** with Spring (verify existing users can sign in on Node). Confirm algorithm (e.g. bcrypt + salt fields on `users`) during design — **do not invent a new hash format**.
- Google ID token audience must equal `GOOGLE_CLIENT_ID`.
- CORS allow-list from `CORS_ALLOWED_ORIGINS`; credentials true for SPA origins.
- Do not expose Prisma / stack traces in production error `message`.
- Rate limiting / quota for AI is Wave 2; Wave 1 still should not log passwords or full JWTs.

---

## 5. UX / client impact

- Wave 1 goal: **zero required client code changes** when only the base URL env changes.
- Health check used by deploy probes must keep shape `{ status, timestamp }`.
- Auth flows (email + Google redirect hash) must behave identically for web and mobile.
- Error `message` strings should stay human-readable; prefer matching Spring wording where clients may display them.

---

## 6. Performance issues

- Connection pool must stay small on free-tier / Supabase pooler (inherit `DB_POOL_SIZE` / `DB_POOL_MIN_IDLE`).
- Avoid N+1 on list endpoints (recipes with ingredients, etc.) — match Spring fetch strategy or improve cautiously without changing response shape.
- Cold start: Nest should boot reliably on modest VMs; lazy-init of Wave 2 deps later.
- Do not enable verbose SQL logging by default.

---

## 7. Acceptance criteria (Wave 1)

1. `backend-node/` runs locally with env copied from Spring `.env.example` (+ `PORT=8081`).
2. `GET /api/health` matches Spring JSON shape.
3. Signup / signin / Google login work; JWTs authorize CRUD calls.
4. Existing web or mobile client, pointed at Node via env only, can complete: login → list/create/update/delete for recipes, pantry, shopping list, meal plans, folders (and preferences).
5. Same PostgreSQL data visible from both backends during parallel run.
6. Lint, typecheck, and agreed tests pass.
7. Feature doc + (next) design/tasks track Wave 2 explicitly deferred.

---

## 8. Related files (inputs)

| Path | Why |
|------|-----|
| `backend/src/main/resources/application.yml` | Property surface to inherit |
| `backend/.env.example` | Env contract |
| `backend/src/main/java/com/lardermind/common/ApiResponse.java` | Envelope |
| `backend/src/main/java/com/lardermind/config/SecurityConfig.java` | Public routes + CORS |
| `backend/src/main/java/com/lardermind/controller/*` | Route parity |
| `backend/src/main/java/com/lardermind/entity/*` | Prisma model mapping |
| `backend/schema.sql` | Schema reference |
| `docker-compose.yml` | Parallel run / later Node service |
| `frontend/` + `mobile/` API clients | Contract consumers |
| `docs/Overall Project Structure.md` | Repo map update after implementation |

---

## 9. Open questions (resolve in design step)

Facts below are from current Spring (`AuthService`, `JwtUtil`, `MealPlanService`, `application.yml`). Design must lock an answer for each numbered item.

### 9.1 Password hash / salt compatibility with Spring users

**Spring today (not bcrypt):**
- Columns: `users.hashed_password`, `users.salt`
- `makeSalt()` → `String.valueOf(Math.round(System.currentTimeMillis() * Math.random()))`
- `encryptPassword(password, salt)` → **HMAC-SHA1**, key = salt UTF-8 bytes, message = password UTF-8 bytes, output = **lowercase hex**
- Comment in code: mirrors prior Node.js `crypto` HMAC SHA-1

**Design must decide:**
1. Nest verifies/signs with the **same HMAC-SHA1 + hex** so existing rows sign in without reset — **proposed default: yes, byte-compatible port**.
2. Whether Wave 1+ should **also** accept/upgrade to bcrypt (or similar) for new users — **proposed default: no in Wave 1**; optional later migration job. Document weakness of SHA-1 HMAC as tech debt.

### 9.2 JWT algorithm + claims (cross-backend tokens)

**Spring today (`JwtUtil`):**
- Secret: `JWT_SECRET` / `app.jwt-secret` via `Keys.hmacShaKeyFor(secret.getBytes(UTF_8))`
- Sign: `signWith(key)` (JJWT 0.12 HMAC → **HS256** when secret length ≥ 256 bits)
- Claims: **`user_id`** = UUID string only; **`iat`** set; **no `exp`**, no `sub` / email / role
- Filter reads `user_id` only

**Design must decide:**
1. Nest must issue/verify tokens **interchangeable** with Spring during parallel run — **proposed default: same secret, HS256, claim `user_id`, no forced `exp` in Wave 1** (match Spring; add expiry later as coordinated breaking change).
2. Reject inventing `sub`/`role` claims unless both backends emit them.
3. Document minimum `JWT_SECRET` length (JJWT requires ≥ 256 bits for HS256).

### 9.3 Meal-plan confirm / skip — Wave 1 or 1.5?

**Spring today:**
- `GET /api/meal-plan/pending-confirm`
- `POST /api/meal-plan/{id}/confirm` — pantry deduction, inventory audit, status transitions
- `POST /api/meal-plan/{id}/skip` — status only (+ related auto-skip on list/read)

**Design must decide:**
1. **Wave 1** = meal-plan CRUD only (create/list/update/delete as thin parity), **Wave 1.5** = confirm/skip + pantry side effects — **proposed default**.
2. Or fold confirm/skip into Wave 1 if pantry + audit mapping is ready (higher risk).
3. Clients that call confirm/skip must stay on Spring until 1.5 ships (or feature-flag base URL per route — out of scope unless needed).

### 9.4 Users list / delete = full Spring parity?

**Design must decide:**
1. **Proposed default: full Spring parity** for `/api/users` list/get/update/delete (same auth rules and response shapes as `UserController`).
2. Do **not** silently restrict Nest to “self-only” in Wave 1 if Spring allows broader access — any hardening is a **separate** security task applied to **both** backends.
3. Design should paste Spring’s exact authorization rules for these routes so Nest guards match.

### 9.5 Prisma introspect-only until Spring `ddl-auto` is off?

**Spring today:** `spring.jpa.hibernate.ddl-auto: update`

**Design must decide:**
1. **Proposed default: yes** — Wave 1 Prisma = `db pull` / hand-map + **client only**; **no** Prisma migrate that alters shared prod schema while Hibernate still owns DDL.
2. Cutover condition for Prisma migrations: Spring `ddl-auto` → `validate` or `none` (or Spring retired), then Node owns schema.
3. Local/dev may use a Node-only DB for experiments; shared Supabase/prod stays introspect-only until that gate.

### 9.6 Resolution checklist (design doc)

| # | Topic | Proposed default | Status |
|---|--------|------------------|--------|
| 1 | Password | HMAC-SHA1 + salt hex, compatible | **Locked** in design |
| 2 | JWT | HS256 + `user_id` + `iat`, shared secret, no `exp` yet | **Locked** in design |
| 3 | Meal confirm/skip | Wave **1.5** | **Locked** in design |
| 4 | Users list/delete | Full Spring parity | **Locked** in design |
| 5 | Prisma ownership | Introspect-only until `ddl-auto` off | **Locked** in design |

See [backend-node-migration-design.md](../design/backend-node-migration-design.md) §2.

---

## 10. Next step (workflow)

Per `new function prompt` flow:

1. ~~Requirements~~ → this file  
2. ~~Design~~ → `docs/design/backend-node-migration-design.md`  
3. ~~Tasks~~ → `tasks/backend-node-migration/`  
4. **Coding** → implement per task checklist (start at task 01)

When tasks are approved, proceed to Feature Coding (task-by-task).
