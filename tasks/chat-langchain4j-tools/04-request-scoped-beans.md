# Task 04: Request-scoped UserContext and ToolResultCollector

**Phase:** 1 — Backend foundation  
**Depends on:** None  
**Blocks:** 06, 07, 08, 10

## Description

Create request-scoped beans so tools read JWT-derived `userId` and write structured outcomes for the controller without coupling to HTTP.

## Files

| Action | Path |
|--------|------|
| Create | `backend/src/main/java/com/CookCopilot/service/UserContext.java` |
| Create | `backend/src/main/java/com/CookCopilot/service/ToolResultCollector.java` |

## Implementation

**UserContext** — `@Component @RequestScope`:

- `UUID userId` with setter/getter
- Set once in `ChatController` from `Authentication.getPrincipal()`

**ToolResultCollector** — `@Component @RequestScope`:

- `String toolName`, `Map<String, Object> data`
- `setResult(String toolName, Map<String, Object> data)`
- `boolean hasResult()`, getters, optional `clear()`

## Acceptance criteria

- [ ] Both beans are `@RequestScope` Spring components
- [ ] `UserContext` holds `UUID userId`; no tool accepts userId as AI parameter
- [ ] `ToolResultCollector` stores at most one primary result per request (last write wins or first-write wins — document choice)
- [ ] Beans are not singleton-shared across requests (verified in unit test with two mock requests)

## How to test

Unit test with `@ExtendWith(SpringExtension.class)` + `@WebAppConfiguration` or plain instantiation with manual scope proxy:

1. Set userId on `UserContext`; assert getter returns same value.
2. Call `setResult` on TRC; assert `hasResult()` and data match.
3. Two separate request simulations do not leak state.
