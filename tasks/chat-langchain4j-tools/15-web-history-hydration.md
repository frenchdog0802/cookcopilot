# Task 15: Web history hydration on mount

**Phase:** 2 — Frontend  
**Depends on:** 11, 14  
**Blocks:** 23

## Description

On `AICookingAssistant` mount, fetch chat history and replace the default welcome bubble when messages exist.

## Files

| Action | Path |
|--------|------|
| Modify | `frontend/client/src/components/AICookingAssistant.tsx` |

## Implementation

1. `useEffect` on mount → `chatApi.getHistory()`
2. Map `HistoryMessage[]` to local `Message[]` state
3. If non-empty, replace welcome-only state with history
4. If empty or error, keep current welcome message
5. Handle loading state (optional subtle spinner or no-op)

## Acceptance criteria

- [ ] Prior conversation visible after page refresh when backend has history
- [ ] Empty history shows existing welcome bubble
- [ ] Failed history fetch does not break chat (fallback to welcome)
- [ ] Message order matches server (oldest first)
- [ ] No duplicate welcome + history

## How to test

1. Send several messages via chat; refresh page → history restored.
2. New user / empty DB → welcome only.
3. Disconnect network on mount → welcome still shown; send still works.
