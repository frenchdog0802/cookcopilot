# Task 03: ChatSessionsService + history backfill

**Phase:** 1  
**Depends on:** 02  
**Blocks:** 07–08

## Description

Implement session CRUD, default session resolution, orphan message backfill, DB `lockedAt` helpers.

## Acceptance criteria

- [ ] `ensureDefaultSession(userId)`
- [ ] `list/create/rename/delete`
- [ ] Ownership checks throw/return not found for other users
- [ ] Backfill assigns `sessionId` to existing messages

## How to test

Unit test session resolve + backfill with Prisma mock or test DB.
