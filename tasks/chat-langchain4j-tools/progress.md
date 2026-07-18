# Progress: chat-langchain4j-tools

**Last updated:** 2026-06-15  
**Overall:** 22 / 23 tasks complete (96%)

## Phase summary

| Phase | Complete | Total | Status |
|-------|----------|-------|--------|
| 1 — Backend foundation | 13 | 13 | Complete |
| 2 — Frontend | 7 | 7 | Complete |
| 3 — Cleanup & verification | 2 | 3 | Manual QA pending |

## Current focus

**Next task:** [23 — Regression and rollback verification](./23-regression-verification.md)

## Completed tasks

- **01–13** — Backend LangChain4j migration, tools, history, tests
- **14–20** — Web and mobile API clients, history hydration, response cards, navigation
- **21–22** — Legacy service removal, updated actions endpoint

## Blockers

_None._

## Notes

- LangChain4j starter uses `1.0.0-beta5` plus `langchain4j:1.0.0` core (design doc `1.0.0` artifact not published on Maven Central).
- Backend tests use H2 in-memory profile (`application-test.yml`) with mocked `CookingAssistant` for integration tests.
- Task 23 manual QA and rollback drill remain for human verification in a running environment.

## Success criteria (from design)

- [x] Chat uses LangChain4j with native tool calling; no JSON action parsing in controller
- [x] Five tools operational; two new tools persist recipes and shopping list items
- [x] Last 20 messages in AI context; last 50 load in UI on mount
- [x] `recipe_created` and `shopping_list_updated` cards on web and mobile
- [x] Existing meal-plan chat actions return `action_result` as before
- [x] `POST /api/chat/send` request shape unchanged
- [x] Prompt guard and userId scoping enforced
- [x] DB index applied; no full-table scan on history load
- [ ] Rollback path verified
