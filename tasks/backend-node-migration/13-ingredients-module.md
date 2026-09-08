# Task 13: Ingredients module + bulk

**Phase:** 3 — Core CRUD  
**Depends on:** 03, 04, 05, 08  
**Blocks:** 14, 15, 16

## Description

Port `/api/ingredient` CRUD and `POST /api/ingredient/bulk` matching Spring.

## Files

| Action | Path |
|--------|------|
| Create | `backend-node/src/ingredients/*` |

## Implementation

- Standard CRUD + bulk insert request/response shapes from Spring DTOs.
- Empty bulk: match Spring validation (no crash).
- Port unit fields (`default_unit`, `unit_kind`, etc.) as present on entity.

## Acceptance criteria

- [ ] Single create/get/list/update/delete work
- [ ] Bulk insert returns Spring-shaped response
- [ ] JWT required

## How to test

Create one ingredient; bulk create two; list and verify.
