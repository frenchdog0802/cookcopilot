# Task 05: Dual Spring/Nest request payload

**Phase:** 2 — Integration  
**Depends on:** None  
**Blocks:** 10

## Description

Update `toRequestPayload` to send flat fields + nested `details` for both backends.

## Files

| Action | Path |
|--------|------|
| Modify | `mobile/src/api/shoppingList.ts` |

## Acceptance criteria

- [ ] Payload includes `quantity`, `unit`, `checked` at top level and inside `details`
- [ ] Existing parsers still accept Spring and Nest responses
