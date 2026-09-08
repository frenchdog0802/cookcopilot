# Task 20: Wave 1 regression / client env flip QA

**Phase:** 4 — Verify & docs  
**Depends on:** 08–17, 18, 19  
**Blocks:** None (Wave 1 complete)

## Description

Manual QA: point web or mobile at Node only via env; verify Wave 1 flows; confirm Spring still used for deferred routes.

## Files

| Action | Path |
|--------|------|
| Update | `tasks/backend-node-migration/checklist.md` (manual QA section) |
| Update | `tasks/backend-node-migration/progress.md` |

## Implementation

1. Run Spring `:8080` and Node `:8081` against **same** DB (optional but recommended).
2. Point client at Node.
3. Execute checklist manual QA items.
4. Spot-check: meal confirm/skip still requires Spring (Node 404).
5. Write Node-created recipe; verify visible via Spring GET (shared DB).

## Acceptance criteria

- [ ] Checklist manual QA items all checked or waived with reason
- [ ] No client code changes required beyond env
- [ ] Known gaps (1.5/2) documented in progress notes
- [ ] `progress.md` overall reflects Wave 1 completion

## How to test

Human exploratory QA; capture any contract mismatches as follow-up bugs/tasks.
