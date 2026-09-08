# Task 07: Sessions CRUD + scoped history API

**Phase:** 2  
**Depends on:** 03  
**Blocks:** 09–10

## Description

Controller routes for sessions; history GET/DELETE take `sessionId` query (default session fallback). Persist `responseType`/`cardData` on assistant save.

## Acceptance criteria

- [ ] REST matches design
- [ ] History isolated per session
- [ ] Clear history session-scoped

## How to test

e2e or supertest against mocked auth.
