# Task 14: Web API client updates

**Phase:** 2 — Frontend  
**Depends on:** 11 (for live `getHistory`; types can be added earlier)  
**Blocks:** 15, 16, 17

## Description

Update the web chat API module with narrowed response types and a `getHistory()` helper.

## Files

| Action | Path |
|--------|------|
| Modify | `frontend/client/src/api/chat.ts` |

## Implementation

```typescript
export interface ChatResponse {
  type: 'text' | 'recipe_created' | 'shopping_list_updated'
      | 'action_result' | 'error';
  message: string;
  data?: Record<string, unknown>;
}

export interface HistoryMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

getHistory: () => api.get<{ messages: HistoryMessage[] }>('/api/chat/history'),
```

Remove or stop exporting reliance on dropped types (`recipe`, `tip`, `clarification`, `refusal`, `action_error`).

`POST /api/chat/send` URL and payload unchanged.

## Acceptance criteria

- [ ] `ChatResponse.type` union matches backend envelope
- [ ] `getHistory()` calls `GET /api/chat/history`
- [ ] TypeScript compiles with no errors in consumers
- [ ] Existing `sendMessage` function signature unchanged

## How to test

1. `npm run build` (or `tsc --noEmit`) in `frontend/client`.
2. Manual: call `getHistory()` in browser devtools against running backend.
