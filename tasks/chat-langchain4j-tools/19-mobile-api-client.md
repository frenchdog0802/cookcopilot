# Task 19: Mobile API client updates

**Phase:** 2 — Frontend  
**Depends on:** 11  
**Blocks:** 20

## Description

Mirror web chat API changes in the React Native mobile app.

## Files

| Action | Path |
|--------|------|
| Modify | `mobile/src/api/chat.ts` |

## Implementation

Same as task 14:

- Updated `ChatResponse` type union
- `HistoryMessage` interface
- `getHistory()` method

## Acceptance criteria

- [ ] Types match web `chat.ts` contract
- [ ] `getHistory()` hits `/api/chat/history` with auth headers
- [ ] Mobile app builds without TypeScript errors

## How to test

```bash
cd mobile && npx tsc --noEmit
```

Optional: log `getHistory()` response on device/simulator against dev backend.
