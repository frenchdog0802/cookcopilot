# Task 03: Prisma schema + PrismaService

**Phase:** 1 — Scaffold & shared infra  
**Depends on:** 01, 02  
**Blocks:** 08–17

## Description

Add Prisma against the **existing** PostgreSQL schema. Wave 1: client only — no migrations that alter shared DB while Spring Hibernate owns DDL.

## Files

| Action | Path |
|--------|------|
| Create | `backend-node/prisma/schema.prisma` |
| Create | `backend-node/src/prisma/prisma.module.ts` |
| Create | `backend-node/src/prisma/prisma.service.ts` |
| Modify | `backend-node/package.json` (`prisma:generate`, `prisma:pull`) |
| Modify | `backend-node/src/app.module.ts` |

## Implementation

- Map Wave 1 tables: `users`, `user_preferences` (+ preference item tables), `folders`, `recipes`, `recipe_ingredients`, `steps` (if present), `ingredients`, `pantry_items`, `shopping_list_items`, `meal_plans`.
- Prefer `prisma db pull` when DB is available; otherwise hand-map from `backend/schema.sql` + entities.
- Build `DATABASE_URL` from `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, `DB_SSL_MODE`.
- Honor small pool / PgBouncer notes from design (document connection params).
- Timestamps: `BigInt` unix seconds — match Spring.
- **Forbidden:** `prisma migrate deploy` / `db push` against shared prod/dev used by Spring in this task.

## Acceptance criteria

- [ ] `npx prisma generate` succeeds
- [ ] Nest injects `PrismaService` and can `$connect` with valid DB env
- [ ] No destructive schema change applied to shared DB
- [ ] Wave 1 models cover tables listed above

## How to test

```powershell
cd backend-node
npm run prisma:generate
# with DB up: node -e or a tiny smoke that PrismaService connects
```
