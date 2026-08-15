# Task 11: Restyle PantryInventoryScreen

**Phase:** 3 — Home & tabs screens  
**Depends on:** 02, 04, 06  
**Blocks:** 19

## Description

Token-align Pantry Inventory: linen background, quiet header, herb actions, list-row / hairline dividers instead of rainbow cards where possible.

## Files

| Action | Path |
|--------|------|
| Modify | `mobile/src/screens/PantryInventoryScreen.tsx` |

## Implementation

Replace legacy orange/gray/rainbow classes and inline hex with tokens/primitives. Preserve CRUD / filter behavior. Cards only for forms/modals or interactive rows that need them.

## Acceptance criteria

- [ ] Warm Kitchen colors throughout
- [ ] No behavior regressions for list/add/edit/delete (as applicable)
- [ ] Primary actions use herb

## How to test

Open Pantry tab; scroll list; perform one add/edit/delete smoke if UI supports it.
