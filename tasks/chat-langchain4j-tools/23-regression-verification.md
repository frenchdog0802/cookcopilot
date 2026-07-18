# Task 23: Regression and rollback verification

**Phase:** 3 — Cleanup & verification  
**Depends on:** 15–20, 21, 22  
**Blocks:** None

## Description

Run manual QA and a rollback drill to confirm no regressions in unrelated features and that the migration can be reverted safely.

## Scope

Per design §9.3–9.4 and §14 success criteria.

## Manual QA checklist

- [ ] Existing meal-plan action via chat returns `action_result`
- [ ] Create recipe from chat appears in Recipe Manager (web + mobile)
- [ ] Shopping list items visible after tool (web + mobile)
- [ ] Page refresh shows prior messages (web)
- [ ] Mobile navigation buttons work (View Recipe, View Shopping List, Add to Menu)
- [ ] Prompt injection patterns blocked (`ignore previous`, etc.) → `type: error`
- [ ] Unrelated flows unchanged: recipe CRUD, shopping list CRUD, calendar, pantry

## Rollback drill

1. Tag or note commit before task 21 deletion
2. Revert to pre-migration `ChatController` + `OpenAIService` + `ChatActionService`
3. Redeploy/run locally → stateless chat works
4. Re-apply migration branch → `ai_messages` index still present; history loads

## Acceptance criteria

- [ ] All manual QA items checked
- [ ] Rollback drill documented with outcome (pass/fail + notes)
- [ ] No P0/P1 bugs open for chat feature
- [ ] Design §14 success criteria all satisfied

## How to test

Execute checklist on web and mobile against staging or local stack with real OpenAI key for at least one tool-invocation path.

Record results in [progress.md](./progress.md) notes section.
