# Task 08: send/stream/resume + interrupt + locks

**Phase:** 2  
**Depends on:** 06, 07  
**Blocks:** 09–10

## Description

Wire sessionId into send/stream; SSE `interrupt`; resume endpoint; session-scoped guard + lockedAt. Quota once on send only.

## Acceptance criteria

- [ ] interrupt event shape documented
- [ ] resume does not increment quota
- [ ] Concurrent same-session busy; cross-session OK

## How to test

Controller unit/e2e with mocked graph returning interrupt.
