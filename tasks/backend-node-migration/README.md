# Tasks: Backend Migration – NestJS (`backend-node/`)

**Feature:** [backend-node-migration](../../docs/features/backend-node-migration.md)  
**Design:** [backend-node-migration-design](../../docs/design/backend-node-migration-design.md)

## How to use

1. Work tasks in order within each phase; cross-phase dependencies are noted in each task file.
2. Mark completion in [checklist.md](./checklist.md) and update [progress.md](./progress.md).
3. Each task is independently completable, testable, and includes acceptance criteria.
4. Coding: follow `new function prompt/4.Feature Coding Prompt.txt` per task.

## Phases

| Phase | Tasks | Focus |
|-------|-------|-------|
| 1 — Scaffold & shared infra | 01–05 | Nest app, env, Prisma, ApiResponse, JWT guard |
| 2 — Auth & health | 06–09 | Health, password crypto, email auth, Google |
| 3 — Core CRUD | 10–17 | Users → preferences → folders → ingredients → recipes → pantry → shopping → meal-plan CRUD |
| 4 — Verify & docs | 18–20 | Integration smoke, README/parallel run, client QA |

**Deferred (not in this folder yet):** Wave 1.5 meal confirm/skip; Wave 2 chat/LangChain.js, upload, subscription.

## Task index

| # | Task | Status |
|---|------|--------|
| 01 | [Scaffold NestJS `backend-node/`](./01-scaffold-nestjs.md) | ✅ |
| 02 | [Config – inherit Spring env properties](./02-config-env-inheritance.md) | ✅ |
| 03 | [Prisma schema + PrismaService](./03-prisma-schema-and-client.md) | ✅ |
| 04 | [ApiResponse, exception filter, CORS](./04-api-response-filter-cors.md) | ✅ |
| 05 | [JWT service + Auth guard](./05-jwt-auth-guard.md) | ✅ |
| 06 | [Health endpoint](./06-health-endpoint.md) | ✅ |
| 07 | [Password util HMAC-SHA1 + unit tests](./07-password-hmac-sha1.md) | ✅ |
| 08 | [Auth signup / signin / signout](./08-auth-email.md) | ✅ |
| 09 | [Google login + callback](./09-auth-google.md) | ✅ |
| 10 | [Users module](./10-users-module.md) | ✅ |
| 11 | [User preferences module](./11-user-preferences-module.md) | ✅ |
| 12 | [Folders module](./12-folders-module.md) | ✅ |
| 13 | [Ingredients module + bulk](./13-ingredients-module.md) | ✅ |
| 14 | [Recipes module CRUD](./14-recipes-module.md) | ✅ |
| 15 | [Pantry items module + bulk](./15-pantry-items-module.md) | ✅ |
| 16 | [Shopping list module + bulk](./16-shopping-list-module.md) | ✅ |
| 17 | [Meal plans module CRUD only](./17-meal-plans-crud.md) | ✅ |
| 18 | [Integration smoke tests](./18-integration-smoke-tests.md) | ✅ |
| 19 | [README + parallel-run docs](./19-readme-parallel-run.md) | ✅ |
| 20 | [Wave 1 regression / client env flip QA](./20-wave1-regression-qa.md) | ✅ |
