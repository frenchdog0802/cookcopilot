# Checklist: chat-langgraph

## Backend foundation

- [x] 01 — LangGraph deps & env
- [x] 02 — Prisma ChatSession + AIMessage extensions
- [x] 03 — Session service + backfill
- [x] 04 — Postgres/Memory checkpointer wiring
- [x] 05 — HITL policy + StateGraph
- [x] 06 — Replace ChatService.runTurn

## API

- [x] 07 — Sessions CRUD + history scoped
- [x] 08 — send/stream/resume + interrupt SSE + locks

## Clients

- [x] 09 — Web API + session UI + HITL
- [x] 10 — Mobile API + session/HITL + recipeContext fix
- [x] 11 — History card hydration (web + mobile)

## Verification

- [x] 12 — Unit tests
- [x] 13 — e2e / smoke
- [x] 14 — Lint, typecheck, checklist signoff

## Success criteria

- [x] No hand-rolled `while(true)` agent loop
- [x] Multi-session + Checkpointer + HITL working
- [x] Web and mobile aligned on sessionId / resume / recipeContext
