# Task 11: User preferences module

**Phase:** 3 — Core CRUD  
**Depends on:** 03, 04, 05, 08  
**Blocks:** 20

## Description

Port `/api/user-preferences` get/put for the **current** authenticated user (match Spring `UserPreferenceController` behavior).

## Files

| Action | Path |
|--------|------|
| Create | `backend-node/src/user-preferences/*` |

## Implementation

- `GET /api/user-preferences`
- `PUT /api/user-preferences`
- Handle nested allergy/dislike/like/dietary collections as Spring does.
- Create empty preference row on first get if Spring does (verify Spring service and match).

## Acceptance criteria

- [ ] Get/put round-trip persists and returns Spring-shaped DTO
- [ ] Scoped to JWT user (cannot read another user’s prefs via this API)
- [ ] JWT required

## How to test

```powershell
# GET then PUT with Authorization Bearer, assert data
```
