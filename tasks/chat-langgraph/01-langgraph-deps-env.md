# Task 01: Add LangGraph dependencies & env

**Phase:** 1 — Backend foundation  
**Depends on:** None  
**Blocks:** 02–06

## Description

Add `@langchain/langgraph` and `@langchain/langgraph-checkpoint-postgres`. Extend env schema with `CHAT_HITL_ENABLED`, `CHAT_RECURSION_LIMIT`, `CHAT_USE_MEMORY_CHECKPOINTER`. Update `.env.example`.

## Acceptance criteria

- [ ] Packages installed and importable
- [ ] Env parsed into `AppConfig.optional` (or dedicated chat config)
- [ ] Test setup can disable HITL / use memory checkpointer

## How to test

```powershell
cd backend-node
npm install
npm run build
```
