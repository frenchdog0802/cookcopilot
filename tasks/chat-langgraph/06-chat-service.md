# Task 06: Replace ChatService.runTurn

**Phase:** 1  
**Depends on:** 05  
**Blocks:** 08

## Description

Refactor `ChatService` to invoke/stream/resume graph. Remove `ChatMemoryService` usage from hot path (delete or leave unused). Preserve userFacingError mapping and tool result mapping.

## Acceptance criteria

- [ ] `runTurn` while-loop removed
- [ ] send/stream/resume methods exist
- [ ] ToolResultCollector still drives response types

## How to test

`npm run build` + unit tests for error mapping.
