# Task 04: Checkpointer wiring

**Phase:** 1  
**Depends on:** 01  
**Blocks:** 05–06

## Description

Nest provider for checkpointer: PostgresSaver + setup() unless `CHAT_USE_MEMORY_CHECKPOINTER` or test env → MemorySaver.

## Acceptance criteria

- [ ] Graph can compile with injected checkpointer
- [ ] Boot does not crash when memory mode on
- [ ] Postgres setup idempotent

## How to test

Boot with memory flag; import saver in unit test.
