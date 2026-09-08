# Task 14: Recipes module CRUD

**Phase:** 3 — Core CRUD  
**Depends on:** 12, 13  
**Blocks:** 17, 18, 20

## Description

Port `/api/recipe` CRUD with snake_case wire fields (`meal_name`, `folder_id`, ingredients, image map). Thin free-tier max-recipes check from config; skip Unsplash auto-stock in Wave 1.

## Files

| Action | Path |
|--------|------|
| Create | `backend-node/src/recipes/*` |
| Create | `backend-node/src/common/unit/*.ts` (port helpers as needed) |

## Implementation

- List/get/create/update/delete by user.
- Persist recipe ingredients; avoid N+1 on list (batch load).
- Thin quota: if recipe count ≥ free `max-recipes` (50 from config) → 402-style quota error when limits apply (design §6.4).
- If `image` omitted → leave null (no stock image fetch in Wave 1).
- Do **not** implement chat/import endpoints here.

## Acceptance criteria

- [ ] Full CRUD with ingredients round-trip
- [ ] Wire JSON uses `meal_name` / `folder_id` etc.
- [ ] List does not explode queries unreasonably
- [ ] Quota path documented/tested with low limit override if feasible

## How to test

Create recipe with ingredients; get by id; update; delete; compare envelope to Spring.
