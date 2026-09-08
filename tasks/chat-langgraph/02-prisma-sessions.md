# Task 02: Prisma ChatSession + AIMessage extensions

**Phase:** 1  
**Depends on:** 01  
**Blocks:** 03+

## Description

Add `ChatSession` model; extend `AIMessage` with `sessionId`, `responseType`, `cardData`. Add User relation. Document SQL/migration approach used by this repo (pull vs migrate).

## Acceptance criteria

- [ ] `schema.prisma` updated
- [ ] `prisma generate` succeeds
- [ ] Indexes as in design doc

## How to test

```powershell
cd backend-node
npx prisma generate
```
