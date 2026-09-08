# Task 17: Meal plans module CRUD only

**Phase:** 3 — Core CRUD  
**Depends on:** 14  
**Blocks:** 18, 20

## Description

Port meal-plan **CRUD only**. Explicitly **exclude** `pending-confirm`, `confirm`, and `skip` (Wave 1.5).

## Files

| Action | Path |
|--------|------|
| Create | `backend-node/src/meal-plans/*` |

## Implementation

| Include | Exclude |
|---------|---------|
| `GET /api/meal-plan` | `GET /pending-confirm` |
| `GET /api/meal-plan/:id` | `POST /:id/confirm` |
| `POST /api/meal-plan` | `POST /:id/skip` |
| `PUT /api/meal-plan/:id` | |
| `DELETE /api/meal-plan/:id` | |

- Include `meal_name` (and image fields if Spring list returns them) via recipe join on list/create responses.
- Status field string parity (`PLANNED`, etc.).

## Acceptance criteria

- [ ] CRUD works with JWT
- [ ] Confirm/skip/pending routes are **absent** (404) on Node
- [ ] DTO wire names: `recipe_id`, `meal_type`, `serving_date`, etc.

## How to test

Create meal plan for a recipe; list; update; delete. Confirm Spring still used for confirm/skip.
